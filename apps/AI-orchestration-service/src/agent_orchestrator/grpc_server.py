import grpc
import asyncio
import os
import secrets
import string
from dotenv import load_dotenv
from bullmq import Queue
import agent_orchestrator.knowledge_pb2 as knowledge_pb2
import agent_orchestrator.knowledge_pb2_grpc as knowledge_pb2_grpc

dotenv_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', '..', '.env')
load_dotenv(dotenv_path)

redis_uri = os.environ.get("REDIS_URI", "redis://localhost:6379")


crawl_queue = Queue("knowledge-crawl-queue", {"connection": redis_uri})

class KnowledgeServiceServicer(knowledge_pb2_grpc.KnowledgeServiceServicer):
    
    async def CrawlSite(self, request, context) -> knowledge_pb2.CrawlSiteResponse:
        
        print(f"[gRPC] Received CrawlSite request for tenant: {request.tenant_id}, url: {request.url}")
        
        alphabet = string.ascii_letters + string.digits
        job_id = f"crawl_{''.join(secrets.choice(alphabet) for _ in range(12))}"
        
        try:
           
            await crawl_queue.add(
                "crawl-site", 
                {
                    "tenant_id": request.tenant_id,
                    "url": request.url,
                    "job_id": job_id
                }, 
                {
                    "jobId": job_id, 
                    "removeOnComplete": False, 
                    "removeOnFail": False
                }
            )
            
            return knowledge_pb2.CrawlSiteResponse(
                message="Crawl job queued successfully",
                job_id=job_id,
                status="queued"
            )
            
        except Exception as e:
            print(f"[gRPC Error] Failed to enqueue crawl task: {str(e)}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(f"FAILED_TO_QUEUE_JOB: {str(e)}")
            return knowledge_pb2.CrawlSiteResponse()

    async def GetCrawlStatus(self, request, context) -> knowledge_pb2.GetCrawlStatusResponse:
       
        print(f"[gRPC] Received GetCrawlStatus request for job: {request.job_id}")
        
        try:
            job = await crawl_queue.getJob(request.job_id)
            if not job:
                context.set_code(grpc.StatusCode.NOT_FOUND)
                context.set_details('CRAWL_JOB_NOT_FOUND')
                return knowledge_pb2.GetCrawlStatusResponse()
                
            state = await job.getState()
            pages_crawled = 0
            pages = []
            
            if state == 'completed' and job.returnvalue:
                
                for url, markdown in job.returnvalue.items():
                    pages.append(knowledge_pb2.CrawlPageResult(
                        url=url,
                        markdown=markdown,
                        success=True,
                        error=""
                    ))
                pages_crawled = len(pages)
                
            return knowledge_pb2.GetCrawlStatusResponse(
                job_id=request.job_id,
                status=state,
                pages_crawled=pages_crawled,
                pages=pages
            )
            
        except Exception as e:
            print(f"[gRPC Error] Failed to fetch crawl status: {str(e)}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(f"INTERNAL_STATUS_QUERY_ERROR: {str(e)}")
            return knowledge_pb2.GetCrawlStatusResponse()

async def serve():
   
    server = grpc.aio.server()
    knowledge_pb2_grpc.add_KnowledgeServiceServicer_to_server(KnowledgeServiceServicer(), server)
    
    port = "50052"
    server.add_insecure_port(f'[::]:{port}')
    print(f"Starting native Async gRPC server on port {port}...")
    await server.start()
    
    
    await server.wait_for_termination()

if __name__ == "__main__":
    try:
        asyncio.run(serve())
    except KeyboardInterrupt:
        print("gRPC Server terminated by user.")