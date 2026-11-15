import asyncio
import hashlib
import json
import os
import re
from urllib.parse import urlparse, urljoin, urlunparse
from pydantic import BaseModel, Field
from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode
from python_worker.queues import publish_schema_generation_job, get_redis_client

try:
    from langchain_google_genai import ChatGoogleGenerativeAI
except ImportError:
    ChatGoogleGenerativeAI = None

try:
    from langchain_groq import ChatGroq
except ImportError:
    ChatGroq = None


CACHE_TTL_SECONDS = int(os.environ.get("CRAWL_CACHE_TTL_SECONDS", "86400"))
DEFAULT_MIN_LINKS = 5
DEFAULT_MAX_LINKS = 7

browser_cfg = BrowserConfig(
    headless=True,
    verbose=False,
    user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) SchedulerCrawler/1.0"
)


run_cfg = CrawlerRunConfig(
    cache_mode=CacheMode.BYPASS,
    word_count_threshold=3,
    excluded_tags=["nav", "header", "footer", "aside", "script", "style", "svg", "noscript"],
    remove_overlay_elements=True,
    remove_consent_popups=True,
    exclude_all_images=True,
    exclude_external_links=True,
    exclude_social_media_links=True,
)


JUNK_REGEX = re.compile(
    r'/(privacy(-policy)?|terms(-of-service|-and-conditions)?|cookie(-policy)?|'
    r'legal|disclaimer|dmca|copyright|imprint|policy|policies|'
    r'blog|news|press|articles?|posts?|feed|tags?|categor(y|ies)|author|archives|'
    r'careers?|jobs?|work-with-us|internships?|'
    r'login|signin|sign-in|signup|sign-up|register|auth|password|account|profile|dashboard|'
    r'cart|checkout|basket|order-status|wishlist|'
    r'wp-content|wp-includes|wp-admin|wp-json|xmlrpc|cgi-bin)/?',
    re.IGNORECASE
)


SERVICE_KEYWORDS = re.compile(
    r'(service|treatment|procedure|pricing|price|cost|rate|package|menu|'
    r'booking|book|appointment|schedule|reservation|'
    r'staff|team|doctor|dentist|therapist|specialist|provider|practitioner|'
    r'about|contact|facility|rooms|hours|location)',
    re.IGNORECASE
)


class SelectedLinksSchema(BaseModel):
    selected_urls: list[str] = Field(
        default_factory=list,
        description="List of selected internal URLs most relevant for services, pricing, hours, staff, and booking."
    )


def make_cache_key(tenant_id: str, url: str) -> str:
    """Creates a tenant-isolated Redis cache key for crawled URLs."""
    url_hash = hashlib.sha256(url.strip().encode()).hexdigest()[:16]
    return f"crawl:cache:{tenant_id}:{url_hash}"


def clean_page_markdown(text: str) -> str:
    """Strips base64 payloads, markdown image embeds, comments, and excessive whitespace."""
    if not text:
        return ""
    # Strip base64 inline images
    text = re.sub(r'data:image/[^;]+;base64,[A-Za-z0-9+/=]+', '', text)
    # Strip markdown image embeds
    text = re.sub(r'!\[.*?\]\(.*?\)', '', text)
    # Strip html comments
    text = re.sub(r'<!--[\s\S]*?-->', '', text)
    # Collapse 3+ newlines into double newlines
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()


def extract_and_score_candidate_links(base_url: str, raw_links: list) -> list[dict]:
    """
    Stage 1: Deterministic heuristic filtering and relevance scoring.
    Filters out media, anchors, junk paths, and ranks links by booking relevance.
    """
    parsed_base = urlparse(base_url)
    base_domain = parsed_base.netloc.lower()
    ignored_extensions = (
        '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.pdf',
        '.docx', '.zip', '.css', '.js', '.mp4', '.mp3', '.ico', '.xml', '.txt', '.json'
    )

    seen = {}
    for link in raw_links:
        href = link.get('href', '').strip()
        text = (link.get('text') or link.get('title') or '').strip()

        if not href or href.startswith(('#', 'mailto:', 'tel:', 'javascript:')):
            continue

        absolute_url = urljoin(base_url, href)
        parsed = urlparse(absolute_url)

        if parsed.netloc.lower() != base_domain:
            continue

        clean_path = parsed.path.rstrip('/')
        if not clean_path:
            continue

        if clean_path.lower().endswith(ignored_extensions):
            continue

   
        normalized_url = urlunparse((parsed.scheme, parsed.netloc, clean_path, '', '', ''))

        if normalized_url == base_url.rstrip('/'):
            continue

     
        if JUNK_REGEX.search(clean_path):
            continue

      
        score = 0
        score += len(SERVICE_KEYWORDS.findall(clean_path)) * 10
        score += len(SERVICE_KEYWORDS.findall(text)) * 8


        depth = len([seg for seg in clean_path.split('/') if seg])
        score += max(0, 5 - depth)

        if normalized_url not in seen or score > seen[normalized_url]['score']:
            seen[normalized_url] = {
                'url': normalized_url,
                'path': clean_path,
                'text': text[:100],
                'score': score
            }

    candidates = sorted(seen.values(), key=lambda x: x['score'], reverse=True)
    return candidates


def filter_internal_links(base_url: str, raw_links: list) -> set:
    """Legacy compatibility helper: returns normalized non-junk internal links."""
    candidates = extract_and_score_candidate_links(base_url, raw_links)
    return {c['url'] for c in candidates}


def _get_classifier_llm():
    """Initializes a lightweight LLM for fast URL classification (Gemini or Groq)."""
    gemini_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if gemini_key and ChatGoogleGenerativeAI:
        model = os.environ.get("GEMINI_MODEL") or "gemini-2.5-flash"
        if "gemma" in model.lower():
            model = "gemini-2.5-flash"
        return ChatGoogleGenerativeAI(
            model=model,
            google_api_key=gemini_key,
            temperature=0,
        )

    groq_key = os.environ.get("GROQ_API_KEY")
    if groq_key and ChatGroq:
        model = os.environ.get("GROQ_MODEL") or "openai/gpt-oss-120b"
        return ChatGroq(
            model_name=model,
            groq_api_key=groq_key,
            temperature=0,
        )

    return None


async def select_relevant_links_with_llm(
    base_url: str,
    candidates: list[dict],
    min_links: int = DEFAULT_MIN_LINKS,
    max_links: int = DEFAULT_MAX_LINKS
) -> list[str]:
    """
    Stage 2: Micro-LLM Link Selector.
    Uses a fast structured LLM call to pick the highest value pages for services, pricing,
    operating hours, staff, and booking.
    Guarantees at least `min_links` if the website has that many candidates.
    """
    if not candidates:
        return []

  
    if len(candidates) <= min_links:
        print(f"[Crawl Link Selector] Site has only {len(candidates)} candidate links <= min {min_links}. Selecting all.")
        return [c['url'] for c in candidates]

   
    candidate_sample = candidates[:20]
    llm = _get_classifier_llm()

    selected_urls: list[str] = []

    if llm:
        try:
            formatted_links = [
                {"url": c["url"], "path": c["path"], "anchor_text": c["text"]}
                for c in candidate_sample
            ]
            prompt = (
                f"You are an AI crawler optimizer for Schedulux, an automated booking & scheduling system.\n"
                f"The business homepage is: {base_url}\n"
                f"Review the candidate internal links below and select the most crucial pages needed to extract:\n"
                f"1. Offered services, treatments, procedures, or bookable assets\n"
                f"2. Pricing, service rates, packages, or membership plans\n"
                f"3. Operating hours, location, and contact information\n"
                f"4. Staff members, practitioners, or specialists\n"
                f"5. Booking policies and guidelines\n\n"
                f"Select AT LEAST {min_links} links (up to {max_links} links).\n"
                f"Only select URLs from this candidate list:\n{json.dumps(formatted_links, indent=2)}\n"
            )

            structured_llm = llm.with_structured_output(SelectedLinksSchema)
            res = await structured_llm.ainvoke(prompt)

            raw_selected = getattr(res, "selected_urls", []) if res else []
            candidate_url_set = {c["url"] for c in candidates}

            for u in raw_selected:
                u_clean = u.strip()
                
                if u_clean in candidate_url_set and u_clean not in selected_urls:
                    selected_urls.append(u_clean)
                else:
                   
                    for c_url in candidate_url_set:
                        if (c_url.endswith(u_clean) or u_clean.endswith(c_url)) and c_url not in selected_urls:
                            selected_urls.append(c_url)
                            break

            print(f"[Crawl Link Selector] LLM selected {len(selected_urls)} high-priority URLs.")
        except Exception as e:
            print(f"[Crawl Link Selector] LLM selection failed ({e}). Falling back to heuristic scoring.", flush=True)

  
    if len(candidates) >= min_links and len(selected_urls) < min_links:
        for cand in candidates:
            if cand["url"] not in selected_urls:
                selected_urls.append(cand["url"])
                if len(selected_urls) >= min_links:
                    break

  
    final_urls = selected_urls[:max_links]
    print(f"[Crawl Link Selector] Final targeted crawl list ({len(final_urls)} links): {final_urls}", flush=True)
    return final_urls


async def crawl_site_knowledge(target_url: str, tenant_id: str = "default") -> dict:
    """
    Crawls a site homepage and targeted internal pages with Redis caching per tenant.
    - Caches homepage result + discovered link list.
    - Uses 3-stage link filtering (regex + heuristic scoring + fast LLM selector).
    - Caches individual crawled pages with stripped boilerplate.
    """
    semaphore = asyncio.Semaphore(2)
    site_knowledge = {}
    redis = get_redis_client()

    urls_to_crawl = []
    initial_cache_key = make_cache_key(tenant_id, target_url)

    cached_initial = await redis.get(initial_cache_key)
    if cached_initial:
        try:
            cached_data = json.loads(cached_initial)
            site_knowledge[target_url] = cached_data.get("markdown", "")
            urls_to_crawl = cached_data.get("internal_links", [])
            print(f"[Crawl Cache] HIT for homepage: {target_url} (Restored {len(urls_to_crawl)} targeted links from cache)")
        except Exception as e:
            print(f"[Crawl Cache] Error parsing cached homepage data: {e}")
            cached_initial = None

    async with AsyncWebCrawler(config=browser_cfg) as crawler:
        if not cached_initial:
            print(f"[Crawl] Starting discovery on: {target_url}")
            initial_result = await crawler.arun(url=target_url, config=run_cfg)

            if not initial_result.success:
                raise Exception(f"Failed to crawl homepage: {initial_result.error_message}")

            clean_home_md = clean_page_markdown(initial_result.markdown)
            site_knowledge[target_url] = clean_home_md

            raw_links = initial_result.links.get("internal", [])
          
            candidate_links = extract_and_score_candidate_links(target_url, raw_links)
            print(f"[Crawl] Discovered {len(candidate_links)} non-junk candidate internal links.")

           
            urls_to_crawl = await select_relevant_links_with_llm(
                target_url,
                candidate_links,
                min_links=DEFAULT_MIN_LINKS,
                max_links=DEFAULT_MAX_LINKS
            )

            homepage_payload = {
                "url": target_url,
                "markdown": clean_home_md,
                "internal_links": urls_to_crawl,
                "is_homepage": True
            }
            await redis.setex(initial_cache_key, CACHE_TTL_SECONDS, json.dumps(homepage_payload))
            print(f"[Crawl Cache] STORED homepage cache for {target_url} (TTL: {CACHE_TTL_SECONDS}s)")

        print(f"[Crawl] Scanning {len(urls_to_crawl)} targeted pages (bounded at least 5 links if available).")

        async def crawl_single_page(page_url: str):
            async with semaphore:
                page_cache_key = make_cache_key(tenant_id, page_url)

                cached_page = await redis.get(page_cache_key)
                if cached_page:
                    try:
                        cached_data = json.loads(cached_page)
                        site_knowledge[page_url] = cached_data.get("markdown", "")
                        print(f"[Crawl Cache] HIT for page: {page_url}")
                        return
                    except Exception as e:
                        print(f"[Crawl Cache] Error reading cache for {page_url}: {e}")

                print(f"[Crawl] Crawling targeted page (Cache MISS): {page_url}")
                try:
                    res = await crawler.arun(url=page_url, config=run_cfg)
                    if res.success:
                        clean_md = clean_page_markdown(res.markdown)
                        site_knowledge[page_url] = clean_md
                        page_payload = {
                            "url": page_url,
                            "markdown": clean_md,
                            "is_homepage": False
                        }
                        await redis.setex(page_cache_key, CACHE_TTL_SECONDS, json.dumps(page_payload))
                    else:
                        print(f"[Crawl] Failed: {page_url} - {res.error_message}")
                except Exception as e:
                    print(f"[Crawl] Error on {page_url}: {str(e)}")

        tasks = [crawl_single_page(url) for url in urls_to_crawl]
        if tasks:
            await asyncio.gather(*tasks)

    return site_knowledge


async def process_crawl_job(data: dict):
    """RabbitMQ message processor — receives a crawl-site job, crawls, and publishes to schema-generation-queue."""
    tenant_id = data.get("tenant_id", "default")
    url = data.get("url")
    job_id = data.get("job_id")
    redis = get_redis_client()

    print(f"[Crawler Worker] Processing job {job_id} for tenant {tenant_id} — URL: {url}", flush=True)

    try:
        status_payload = {
            "status": "active",
            "tenant_id": tenant_id,
            "url": url,
            "job_id": job_id,
            "pages": {},
        }
        await redis.setex(f"crawl:job:{job_id}", 86400, json.dumps(status_payload))

        knowledge = await crawl_site_knowledge(url, tenant_id=tenant_id)

        await publish_schema_generation_job(
            tenant_id=tenant_id,
            url=url,
            job_id=job_id,
            crawled_data=knowledge,
        )

        status_payload["status"] = "completed"
        status_payload["pages"] = knowledge
        await redis.setex(f"crawl:job:{job_id}", 86400, json.dumps(status_payload))

        print(f"[Crawler Worker] Job {job_id} complete — {len(knowledge)} pages crawled and pushed to schema-generation-queue", flush=True)
        return knowledge

    except Exception as e:
        print(f"[Crawler Worker] Job {job_id} failed: {str(e)}", flush=True)
        try:
            err_payload = {
                "status": "failed",
                "tenant_id": tenant_id,
                "url": url,
                "job_id": job_id,
                "error": str(e),
            }
            await redis.setex(f"crawl:job:{job_id}", 86400, json.dumps(err_payload))
        except Exception:
            pass
        raise
