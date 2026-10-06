import asyncio
import hashlib
import json
import os
from urllib.parse import urlparse, urljoin
from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode
from python_worker.queues import get_schema_queue, get_redis_client

# Cache TTL: 24 hours (86400 seconds)
CACHE_TTL_SECONDS = int(os.environ.get("CRAWL_CACHE_TTL_SECONDS", "86400"))

browser_cfg = BrowserConfig(
    headless=True,
    verbose=False,
    user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) SchedulerCrawler/1.0"
)

run_cfg = CrawlerRunConfig(
    cache_mode=CacheMode.BYPASS,
    word_count_threshold=3
)

def make_cache_key(tenant_id: str, url: str) -> str:
    """Creates a tenant-isolated Redis cache key for crawled URLs."""
    url_hash = hashlib.sha256(url.strip().encode()).hexdigest()[:16]
    return f"crawl:cache:{tenant_id}:{url_hash}"

def filter_internal_links(base_url: str, raw_links: list) -> set:
    """Filters out external domains, anchors, and media formats."""
    parsed_base = urlparse(base_url)
    base_domain = parsed_base.netloc
    
    clean_urls = set()
    ignored_extensions = ('.png', '.jpg', '.jpeg', '.gif', '.pdf', '.docx', '.zip', '.css', '.js')

    for link in raw_links:
        href = link.get('href', '').strip()
        if not href or href.startswith('#') or href.startswith('mailto:') or href.startswith('tel:'):
            continue

        absolute_url = urljoin(base_url, href)
        parsed_absolute = urlparse(absolute_url)

        if parsed_absolute.netloc == base_domain:
            if not parsed_absolute.path.lower().endswith(ignored_extensions):
                normalized_url = f"{parsed_absolute.scheme}://{parsed_absolute.netloc}{parsed_absolute.path}"
                clean_urls.add(normalized_url)
                
    return clean_urls

async def crawl_site_knowledge(target_url: str, tenant_id: str = "default") -> dict:
    """
    Crawls a site homepage and internal pages with Redis caching per tenant.
    - Caches initial homepage result + discovered link list.
    - Caches individual crawled pages.
    - If BullMQ retries, completed pages are fetched directly from Redis cache.
    """
    semaphore = asyncio.Semaphore(2)
    site_knowledge = {}
    redis = get_redis_client()

    urls_to_crawl = set()
    initial_cache_key = make_cache_key(tenant_id, target_url)

    cached_initial = await redis.get(initial_cache_key)
    if cached_initial:
        try:
            cached_data = json.loads(cached_initial)
            site_knowledge[target_url] = cached_data.get("markdown", "")
            urls_to_crawl = set(cached_data.get("internal_links", []))
            print(f"[Crawl Cache] HIT for homepage: {target_url} (Restored {len(urls_to_crawl)} internal links from cache)")
        except Exception as e:
            print(f"[Crawl Cache] Error parsing cached homepage data: {e}")
            cached_initial = None

    async with AsyncWebCrawler(config=browser_cfg) as crawler:
        if not cached_initial:
            print(f"[Crawl] Starting discovery on: {target_url}")
            initial_result = await crawler.arun(url=target_url, config=run_cfg)
            
            if not initial_result.success:
                raise Exception(f"Failed to crawl homepage: {initial_result.error_message}")
                
            site_knowledge[target_url] = initial_result.markdown
            
            raw_links = initial_result.links.get("internal", [])
            urls_to_crawl = filter_internal_links(target_url, raw_links)
            urls_to_crawl.discard(target_url)

            homepage_payload = {
                "url": target_url,
                "markdown": initial_result.markdown,
                "internal_links": list(urls_to_crawl),
                "is_homepage": True
            }
            await redis.setex(initial_cache_key, CACHE_TTL_SECONDS, json.dumps(homepage_payload))
            print(f"[Crawl Cache] STORED homepage cache for {target_url} (TTL: {CACHE_TTL_SECONDS}s)")

        print(f"[Crawl] Total internal pages to scan: {len(urls_to_crawl)}")

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

                print(f"[Crawl] Crawling (Cache MISS): {page_url}")
                try:
                    res = await crawler.arun(url=page_url, config=run_cfg)
                    if res.success:
                        site_knowledge[page_url] = res.markdown
                        page_payload = {
                            "url": page_url,
                            "markdown": res.markdown,
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

async def process_crawl_job(job, token):
    """BullMQ job processor — receives a crawl-site job, crawls, and passes to schema-generation-queue."""
    data = job.data
    tenant_id = data.get("tenant_id", "default")
    url = data.get("url")
    job_id = data.get("job_id")
    
    print(f"[Crawler Worker] Processing job {job_id} for tenant {tenant_id} — URL: {url}")
    
    try:
        await job.updateProgress(10)
        
        knowledge = await crawl_site_knowledge(url, tenant_id=tenant_id)
        
        schema_queue = get_schema_queue()
        await schema_queue.add(
            "generate-schema",
            {
                "tenant_id": tenant_id,
                "url": url,
                "job_id": job_id,
                "crawled_data": knowledge
            },
            {"jobId": f"schema_{job_id}"}
        )
        
        await job.updateProgress(100)
        
        print(f"[Crawler Worker] Job {job_id} complete — {len(knowledge)} pages crawled and pushed to schema-generation-queue")
        
        return knowledge
        
    except Exception as e:
        print(f"[Crawler Worker] Job {job_id} failed: {str(e)}")
        raise
