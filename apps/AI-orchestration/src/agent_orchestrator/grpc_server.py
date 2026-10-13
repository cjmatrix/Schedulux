import grpc
import asyncio
import os
import secrets
import string
from dotenv import load_dotenv
from bullmq import Queue
import agent_orchestrator.knowledge_pb2 as knowledge_pb2
import agent_orchestrator.knowledge_pb2_grpc as knowledge_pb2_grpc
import json
from datetime import datetime
import redis.asyncio as aioredis
from agent_orchestrator.models import AgentDraft, AgentRuntimeConfig, init_db
from agent_orchestrator.tenant_agent import start_onboarding_session, resume_onboarding_session, get_current_draft

local_env = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '.env'))
load_dotenv(local_env)

redis_uri = os.environ.get("REDIS_URI", "redis://localhost:6379")

_redis_client: aioredis.Redis | None = None

def _get_redis_client() -> aioredis.Redis:
    global _redis_client
    if _redis_client is None:
        _redis_client = aioredis.from_url(redis_uri, decode_responses=True)
    return _redis_client

crawl_queue = Queue("knowledge-crawl-queue", {"connection": redis_uri})

class KnowledgeServiceServicer(knowledge_pb2_grpc.KnowledgeServiceServicer):
    
    async def CrawlSite(self, request, context) -> knowledge_pb2.CrawlSiteResponse:
        
        print(f"[gRPC] Received CrawlSite request for tenant: {request.tenant_id}, url: {request.url}")
        
        job_id = f"crawl_{secrets.token_urlsafe(12)}" 
        
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

    async def StartOnboardingSession(self, request, context) -> knowledge_pb2.OnboardingResponse:
        print(f"[gRPC] Received StartOnboardingSession request for tenant: {request.tenant_id}, agent: {request.agent_id}")
        await init_db()
        try:
            agent_draft = await AgentDraft.find_one({"tenant_id": request.tenant_id, "agent_id": request.agent_id})
            if not agent_draft:
                context.set_code(grpc.StatusCode.NOT_FOUND)
                context.set_details(f"Agent draft not found for agent_id: {request.agent_id}")
                return knowledge_pb2.OnboardingResponse()

            initial_draft = agent_draft.current_draft or {}
            payload = await start_onboarding_session(request.tenant_id, initial_draft)
            current_draft = await get_current_draft(request.tenant_id)
            draft_json = json.dumps(current_draft or initial_draft)
            
            return knowledge_pb2.OnboardingResponse(
                status=payload.get("status", "error"),
                question=payload.get("question") or "",
                field=payload.get("field") or "",
                type=payload.get("type") or "",
                draft_schema_json=draft_json
            )
        except Exception as e:
            print(f"[gRPC Error] StartOnboardingSession failed: {str(e)}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(f"START_ONBOARDING_ERROR: {str(e)}")
            return knowledge_pb2.OnboardingResponse()

    async def ResumeOnboardingSession(self, request, context) -> knowledge_pb2.OnboardingResponse:
        print(f"[gRPC] Received ResumeOnboardingSession request for tenant: {request.tenant_id}")
        
        try:
            payload = await resume_onboarding_session(request.tenant_id, request.user_answer)
            draft_json = json.dumps(await get_current_draft(request.tenant_id))
            
            return knowledge_pb2.OnboardingResponse(
                status=payload.get("status", "error"),
                question=payload.get("question") or "",
                field=payload.get("field") or "",
                type=payload.get("type") or "",
                draft_schema_json=draft_json
            )
        except Exception as e:
            print(f"[gRPC Error] ResumeOnboardingSession failed: {str(e)}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(f"RESUME_ONBOARDING_ERROR: {str(e)}")
            return knowledge_pb2.OnboardingResponse()

    async def SaveInitialAgentDraft(self, request, context) -> knowledge_pb2.SaveInitialAgentDraftResponse:
        print(f"[gRPC] Received SaveInitialAgentDraft request for tenant: {request.tenant_id}")
        await init_db()
        try:
            draft_dict = {}
            creation_source = (request.creation_source or "web_crawl").strip().lower()
            

            r_client = _get_redis_client()
            redis_draft = await r_client.get(f"agent:draft:{request.tenant_id}")

            if creation_source == "web_crawl":
                if redis_draft:
                    print(f"[SaveInitialAgentDraft] Found draft schema in Redis for tenant: {request.tenant_id}", flush=True)
                    draft_dict = json.loads(redis_draft)
                elif request.draft_json:
                    print(f"[SaveInitialAgentDraft] Falling back to request.draft_json for tenant: {request.tenant_id}", flush=True)
                    draft_dict = json.loads(request.draft_json)
                else:
                    context.set_code(grpc.StatusCode.NOT_FOUND)
                    context.set_details(f"No draft schema found for tenant {request.tenant_id} in Redis or request payload")
                    return knowledge_pb2.SaveInitialAgentDraftResponse()
            else:
                default_names = {
                    "medical": "Medical & Dental Clinics",
                    "auto": "Auto Repair & Services",
                    "hospitality": "Hospitality & Rooms",
                    "custom": "Custom Scheduling Service",
                }
                template_name = default_names.get(creation_source, "Primary Assistant")
                draft_dict = {
                    "schema_ref": "https://schedulux.ai/schema/v2/agent_runtime_config.json",
                    "schema_version": "2.4",
                    "status": "draft",
                    "tenant_id": request.tenant_id,
                    "business_profile": {
                        "name": request.name or template_name,
                        "vertical": creation_source,
                    },
                    "operating_hours": {
                        "monday": [{"start": "09:00", "end": "17:00"}],
                        "tuesday": [{"start": "09:00", "end": "17:00"}],
                        "wednesday": [{"start": "09:00", "end": "17:00"}],
                        "thursday": [{"start": "09:00", "end": "17:00"}],
                        "friday": [{"start": "09:00", "end": "17:00"}],
                        "saturday": [],
                        "sunday": []
                    },
                    "services": [],
                    "resources": [],
                    "runtime_meta": {
                        "template_id": f"tpl_{creation_source}_v1",
                        "compiler_mode": "manual_template",
                    }
                }

            bp = draft_dict.get("business_profile", {})
            name = request.name or bp.get("name") or "Primary Assistant"
            agent_id = f"agent_{secrets.token_urlsafe(16)}"
            draft_dict["agent_id"] = agent_id

            agent_draft = await AgentDraft.find_one({"tenant_id": request.tenant_id, "agent_id": agent_id})
            if not agent_draft:
                agent_draft = AgentDraft(
                    tenant_id=request.tenant_id,
                    agent_id=agent_id,
                    name=name,
                    creation_source=creation_source,
                    current_draft=draft_dict,
                )
                agent_draft.add_checkpoint(
                    checkpoint_id=f"cp_{secrets.token_hex(4)}",
                    message_id="initial_creation",
                    user_prompt=f"Initial agent creation ({creation_source})",
                    summary=f"Created agent draft from {creation_source}",
                    draft_snapshot=draft_dict,
                )
                await agent_draft.save()
            else:
                agent_draft.name = name
                agent_draft.creation_source = creation_source
                agent_draft.current_draft = draft_dict
                agent_draft.updated_at = datetime.utcnow()
                agent_draft.add_checkpoint(
                    checkpoint_id=f"cp_{secrets.token_hex(4)}",
                    message_id="update_draft",
                    user_prompt=f"Updated draft ({creation_source})",
                    summary=f"Updated draft snapshot ({creation_source})",
                    draft_snapshot=draft_dict,
                )
                await agent_draft.save()

            return knowledge_pb2.SaveInitialAgentDraftResponse(
                message="Agent draft saved successfully",
                agent_id=agent_id,
                status="pending"
            )
        except Exception as e:
            print(f"[gRPC Error] SaveInitialAgentDraft failed: {str(e)}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(f"SAVE_DRAFT_ERROR: {str(e)}")
            return knowledge_pb2.SaveInitialAgentDraftResponse()

    async def ListTenantAgents(self, request, context) -> knowledge_pb2.ListTenantAgentsResponse:
        print(f"[gRPC] Received ListTenantAgents request for tenant: {request.tenant_id}")
        await init_db()
        try:
            agents_map = {}

            # 1. Fetch created / active agents from AgentRuntimeConfig
            created_configs = await AgentRuntimeConfig.find({"tenant_id": request.tenant_id}).to_list()
            for cfg in created_configs:
                aid = cfg.agent_id or str(cfg.id)
                bp = cfg.business_profile
                name = (bp.name if bp else None) or "Active Agent"
                agents_map[aid] = knowledge_pb2.AgentSummaryInfo(
                    agent_id=aid,
                    name=name,
                    status="created",
                    creation_source="web_crawl",
                    services_count=len(cfg.services) if cfg.services else 0,
                    updated_at=cfg.compiled_at.isoformat() if cfg.compiled_at else "",
                    created_at=cfg.compiled_at.isoformat() if cfg.compiled_at else "",
                )

            
            drafts = await AgentDraft.find({"tenant_id": request.tenant_id}).to_list()
            for d in drafts:
                if d.agent_id in agents_map:
                    continue
                d_services = d.current_draft.get("services", []) if isinstance(d.current_draft, dict) else []
                agents_map[d.agent_id] = knowledge_pb2.AgentSummaryInfo(
                    agent_id=d.agent_id,
                    name=d.name or "Draft Agent",
                    status="pending",
                    creation_source=d.creation_source or "web_crawl",
                    services_count=len(d_services),
                    updated_at=d.updated_at.isoformat() if d.updated_at else "",
                    created_at=d.created_at.isoformat() if d.created_at else "",
                )

            agents_list = sorted(
                list(agents_map.values()),
                key=lambda x: x.updated_at or x.created_at,
                reverse=True
            )

            return knowledge_pb2.ListTenantAgentsResponse(agents=agents_list)
        except Exception as e:
            print(f"[gRPC Error] ListTenantAgents failed: {str(e)}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(f"LIST_AGENTS_ERROR: {str(e)}")
            return knowledge_pb2.ListTenantAgentsResponse()

async def serve():
    await init_db()
    server = grpc.aio.server()
    knowledge_pb2_grpc.add_KnowledgeServiceServicer_to_server(KnowledgeServiceServicer(), server)
    
    port = os.environ.get("PORT", "50052")
    server.add_insecure_port(f'[::]:{port}')
    print(f"Starting native Async gRPC server on port {port}...", flush=True)
    await server.start()
    
    try:
        await server.wait_for_termination()
    except (asyncio.CancelledError, KeyboardInterrupt):
        pass
    finally:
        print("[AI Orchestrator Service] Shutting down gRPC server...", flush=True)
        await server.stop(grace=1.0)
        try:
            await crawl_queue.close()
        except Exception:
            pass

if __name__ == "__main__":
    try:
        asyncio.run(serve())
    except KeyboardInterrupt:
        print("gRPC Server terminated by user.")