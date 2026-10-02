import asyncio
import json
import signal
from urllib.parse import urlparse, urljoin
from bullmq import Worker
from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode


# ─── Browser & Crawl Configuration ───────────────────────────────────────────

browser_cfg = BrowserConfig(
    headless=True,
    verbose=False,
    user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) SchedulerCrawler/1.0"
)

run_cfg = CrawlerRunConfig(
    cache_mode=CacheMode.BYPASS,
    word_count_threshold=10
)


# ─── Link Filtering ──────────────────────────────────────────────────────────

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


# ─── Core Crawl Logic ────────────────────────────────────────────────────────

async def crawl_site_knowledge(target_url: str) -> dict:
    """Crawls a site homepage and all discovered internal pages, returns {url: markdown}."""
    semaphore = asyncio.Semaphore(2)
    site_knowledge = {}

    async with AsyncWebCrawler(config=browser_cfg) as crawler:
        print(f"[Crawl] Starting discovery on: {target_url}")
        initial_result = await crawler.arun(url=target_url, config=run_cfg)
        
        if not initial_result.success:
            raise Exception(f"Failed to crawl homepage: {initial_result.error_message}")
            
        site_knowledge[target_url] = initial_result.markdown
        
        raw_links = initial_result.links.get("internal", [])
        urls_to_crawl = filter_internal_links(target_url, raw_links)
        urls_to_crawl.discard(target_url)
        
        print(f"[Crawl] Discovered {len(urls_to_crawl)} internal pages to scan")

        async def crawl_single_page(url: str):
            async with semaphore:
                print(f"[Crawl] Crawling: {url}")
                try:
                    res = await crawler.arun(url=url, config=run_cfg)
                    if res.success:
                        site_knowledge[url] = res.markdown
                    else:
                        print(f"[Crawl] Failed: {url} - {res.error_message}")
                except Exception as e:
                    print(f"[Crawl] Error on {url}: {str(e)}")

        tasks = [crawl_single_page(url) for url in urls_to_crawl]
        await asyncio.gather(*tasks)

    return site_knowledge


# ─── BullMQ Job Processor ────────────────────────────────────────────────────

async def process_crawl_job(job, token):
    """BullMQ job processor — receives a crawl-site job and returns knowledge dict."""
    data = job.data
    tenant_id = data.get("tenant_id")
    url = data.get("url")
    job_id = data.get("job_id")
    
    print(f"[Worker] Processing job {job_id} for tenant {tenant_id} — URL: {url}")
    
    try:
        await job.updateProgress(10)
        
        knowledge = await crawl_site_knowledge(url)
        
        await job.updateProgress(100)
        
        print(f"[Worker] Job {job_id} complete — {len(knowledge)} pages crawled")
        
        return knowledge
        
    except Exception as e:
        print(f"[Worker] Job {job_id} failed: {str(e)}")
        raise


# ─── Worker Entrypoint ───────────────────────────────────────────────────────

async def main():
    print("[Worker] Starting knowledge-crawl-queue worker...")
    
    worker = Worker(
        "knowledge-crawl-queue",
        process_crawl_job,
        {
            "connection": "redis://localhost:6379",
            "concurrency": 1,
        }
    )

    stop_event = asyncio.Event()

    def shutdown_handler():
        print("\n[Worker] Shutting down gracefully...")
        stop_event.set()

    loop = asyncio.get_event_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, shutdown_handler)

    print("[Worker] Listening for jobs on 'knowledge-crawl-queue'...")
    await stop_event.wait()

    await worker.close()
    print("[Worker] Closed.")


if __name__ == "__main__":
    asyncio.run(main())