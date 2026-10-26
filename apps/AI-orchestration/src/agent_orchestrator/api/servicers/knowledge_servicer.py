from __future__ import annotations

import grpc

import agent_orchestrator.proto.knowledge_pb2 as knowledge_pb2
import agent_orchestrator.proto.knowledge_pb2_grpc as knowledge_pb2_grpc
from agent_orchestrator.api.servicers.chat_servicer import ChatRPCHandler
from agent_orchestrator.domain.exceptions import (
    AgentNotFoundException,
    CrawlJobNotFoundException,
    InvalidDraftException,
)
from agent_orchestrator.services.protocols import (
    AgentManagementServiceProtocol,
    ChatServiceProtocol,
    CrawlerServiceProtocol,
    OnboardingServiceProtocol,
)


class KnowledgeServiceServicer(knowledge_pb2_grpc.KnowledgeServiceServicer):
    def __init__(
        self,
        onboarding_service: OnboardingServiceProtocol,
        chat_service: ChatServiceProtocol,
        agent_service: AgentManagementServiceProtocol,
        crawler_service: CrawlerServiceProtocol,
    ):
        self.onboarding_service = onboarding_service
        self.chat_handler = ChatRPCHandler(chat_service)
        self.agent_service = agent_service
        self.crawler_service = crawler_service

    async def CrawlSite(
        self, request: knowledge_pb2.CrawlSiteRequest, context: grpc.aio.ServicerContext
    ) -> knowledge_pb2.CrawlSiteResponse:
        print(f"[gRPC] CrawlSite request for tenant: {request.tenant_id}, url: {request.url}")
        try:
            job_id = await self.crawler_service.crawl_site(request.tenant_id, request.url)
            return knowledge_pb2.CrawlSiteResponse(
                message="Crawl job queued successfully",
                job_id=job_id,
                status="queued",
            )
        except Exception as e:
            print(f"[gRPC Error] CrawlSite failed: {e}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(f"FAILED_TO_QUEUE_JOB: {str(e)}")
            return knowledge_pb2.CrawlSiteResponse()

    async def GetCrawlStatus(
        self, request: knowledge_pb2.GetCrawlStatusRequest, context: grpc.aio.ServicerContext
    ) -> knowledge_pb2.GetCrawlStatusResponse:
        print(f"[gRPC] GetCrawlStatus request for job: {request.job_id}")
        try:
            res = await self.crawler_service.get_crawl_status(request.job_id)
            pages = [
                knowledge_pb2.CrawlPageResult(
                    url=p["url"],
                    markdown=p["markdown"],
                    success=p.get("success", True),
                    error=p.get("error", ""),
                )
                for p in res.pages
            ]
            return knowledge_pb2.GetCrawlStatusResponse(
                job_id=res.job_id,
                status=res.status,
                pages_crawled=res.pages_crawled,
                pages=pages,
            )
        except CrawlJobNotFoundException:
            context.set_code(grpc.StatusCode.NOT_FOUND)
            context.set_details("CRAWL_JOB_NOT_FOUND")
            return knowledge_pb2.GetCrawlStatusResponse()
        except Exception as e:
            print(f"[gRPC Error] GetCrawlStatus failed: {e}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(f"INTERNAL_STATUS_QUERY_ERROR: {str(e)}")
            return knowledge_pb2.GetCrawlStatusResponse()

    async def StartOnboardingSession(
        self, request: knowledge_pb2.StartOnboardingRequest, context: grpc.aio.ServicerContext
    ) -> knowledge_pb2.OnboardingResponse:
        agent_id = getattr(request, "agent_id", "")
        print(f"[gRPC] StartOnboardingSession for tenant: {request.tenant_id}, agent: {agent_id}")
        try:
            res = await self.onboarding_service.start_session(
                tenant_id=request.tenant_id,
                agent_id=agent_id,
                initial_draft_json=request.initial_draft_json,
            )
            return knowledge_pb2.OnboardingResponse(
                status=res.status,
                question=res.question,
                field=res.field,
                type=res.type,
                draft_schema_json=res.draft_schema_json,
                live_schema_json=res.live_schema_json,
            )
        except AgentNotFoundException as anfe:
            context.set_code(grpc.StatusCode.NOT_FOUND)
            context.set_details(str(anfe))
            return knowledge_pb2.OnboardingResponse()
        except Exception as e:
            print(f"[gRPC Error] StartOnboardingSession failed: {e}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(f"START_ONBOARDING_ERROR: {str(e)}")
            return knowledge_pb2.OnboardingResponse()

    async def ResumeOnboardingSession(
        self, request: knowledge_pb2.ResumeOnboardingRequest, context: grpc.aio.ServicerContext
    ) -> knowledge_pb2.OnboardingResponse:
        agent_id = getattr(request, "agent_id", "")
        print(f"[gRPC] ResumeOnboardingSession for tenant: {request.tenant_id}, agent: {agent_id}")
        try:
            res = await self.onboarding_service.resume_session(
                tenant_id=request.tenant_id,
                agent_id=agent_id,
                user_answer=request.user_answer,
            )
            return knowledge_pb2.OnboardingResponse(
                status=res.status,
                question=res.question,
                field=res.field,
                type=res.type,
                draft_schema_json=res.draft_schema_json,
                live_schema_json=res.live_schema_json,
            )
        except Exception as e:
            print(f"[gRPC Error] ResumeOnboardingSession failed: {e}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(f"RESUME_ONBOARDING_ERROR: {str(e)}")
            return knowledge_pb2.OnboardingResponse()

    async def GetAgentMessages(
        self, request: knowledge_pb2.GetAgentMessagesRequest, context: grpc.aio.ServicerContext
    ) -> knowledge_pb2.GetAgentMessagesResponse:
        return await self.chat_handler.get_agent_messages(request, context)

    async def SaveInitialAgentDraft(
        self, request: knowledge_pb2.SaveInitialAgentDraftRequest, context: grpc.aio.ServicerContext
    ) -> knowledge_pb2.SaveInitialAgentDraftResponse:
        print(f"[gRPC] SaveInitialAgentDraft for tenant: {request.tenant_id}")
        try:
            agent_id, status = await self.agent_service.save_initial_draft(
                tenant_id=request.tenant_id,
                creation_source=request.creation_source,
                draft_json=request.draft_json,
                name=request.name,
            )
            return knowledge_pb2.SaveInitialAgentDraftResponse(
                message="Agent draft saved successfully",
                agent_id=agent_id,
                status=status,
            )
        except InvalidDraftException as ide:
            context.set_code(grpc.StatusCode.NOT_FOUND)
            context.set_details(str(ide))
            return knowledge_pb2.SaveInitialAgentDraftResponse()
        except Exception as e:
            print(f"[gRPC Error] SaveInitialAgentDraft failed: {e}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(f"SAVE_DRAFT_ERROR: {str(e)}")
            return knowledge_pb2.SaveInitialAgentDraftResponse()

    async def ListTenantAgents(
        self, request: knowledge_pb2.ListTenantAgentsRequest, context: grpc.aio.ServicerContext
    ) -> knowledge_pb2.ListTenantAgentsResponse:
        print(f"[gRPC] ListTenantAgents for tenant: {request.tenant_id}")
        try:
            agents = await self.agent_service.list_tenant_agents(request.tenant_id)
            proto_agents = [
                knowledge_pb2.AgentSummaryInfo(
                    agent_id=a.agent_id,
                    name=a.name,
                    status=a.status,
                    creation_source=a.creation_source,
                    services_count=a.services_count,
                    updated_at=a.updated_at,
                    created_at=a.created_at,
                )
                for a in agents
            ]
            return knowledge_pb2.ListTenantAgentsResponse(agents=proto_agents)
        except Exception as e:
            print(f"[gRPC Error] ListTenantAgents failed: {e}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(f"LIST_AGENTS_ERROR: {str(e)}")
            return knowledge_pb2.ListTenantAgentsResponse()

    async def CustomerChat(
        self, request: knowledge_pb2.CustomerChatRequest, context: grpc.aio.ServicerContext
    ) -> knowledge_pb2.CustomerChatResponse:
        print(
            f"[gRPC] CustomerChat for tenant: {request.tenant_id}, agent: {request.agent_id}, session: {request.session_id}"
        )
        try:
            from agent_orchestrator.workflows.customer_agent import process_customer_chat

            result = await process_customer_chat(
                tenant_id=request.tenant_id,
                agent_id=request.agent_id,
                session_id=request.session_id,
                message=request.message,
                customer_id=request.customer_id if request.customer_id else None,
                customer_phone=request.customer_phone if request.customer_phone else None,
                customer_name=request.customer_name if request.customer_name else None,
            )
            history_proto = [
                knowledge_pb2.CustomerChatMessageInfo(
                    id=h["id"],
                    session_id=h["session_id"],
                    tenant_id=h["tenant_id"],
                    agent_id=h["agent_id"],
                    role=h["role"],
                    content=h["content"],
                    created_at=h["created_at"],
                )
                for h in result.get("history", [])
            ]
            return knowledge_pb2.CustomerChatResponse(
                session_id=result["session_id"],
                response=result["response"],
                history=history_proto,
            )
        except Exception as e:
            print(f"[gRPC Error] CustomerChat failed: {e}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(f"CUSTOMER_CHAT_ERROR: {str(e)}")
            return knowledge_pb2.CustomerChatResponse(
                session_id=request.session_id,
                response="An error occurred processing your request. Please try again.",
            )

    async def GetCustomerMessages(
        self, request: knowledge_pb2.GetCustomerMessagesRequest, context: grpc.aio.ServicerContext
    ) -> knowledge_pb2.GetCustomerMessagesResponse:
        try:
            from agent_orchestrator.repositories.customer_message_repository import (
                CustomerMessageRepository,
            )

            repo = CustomerMessageRepository()
            limit = request.limit if request.limit > 0 else 10
            msgs = await repo.get_recent_messages(request.session_id, limit=limit)
            return knowledge_pb2.GetCustomerMessagesResponse(
                messages=[
                    knowledge_pb2.CustomerChatMessageInfo(
                        id=str(m.id),
                        session_id=m.session_id,
                        tenant_id=m.tenant_id,
                        agent_id=m.agent_id,
                        role=m.role,
                        content=m.content,
                        created_at=m.created_at.isoformat(),
                    )
                    for m in msgs
                ]
            )
        except Exception as e:
            print(f"[gRPC Error] GetCustomerMessages failed: {e}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(f"GET_CUSTOMER_MESSAGES_ERROR: {str(e)}")
            return knowledge_pb2.GetCustomerMessagesResponse()

