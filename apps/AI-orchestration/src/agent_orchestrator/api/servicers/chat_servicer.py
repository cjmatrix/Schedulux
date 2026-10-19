from __future__ import annotations

import grpc
import agent_orchestrator.knowledge_pb2 as knowledge_pb2
from agent_orchestrator.services.chat_service import ChatService


class ChatRPCHandler:
    def __init__(self, chat_service: ChatService):
        self.chat_service = chat_service

    async def get_agent_messages(
        self, request: knowledge_pb2.GetAgentMessagesRequest, context: grpc.aio.ServicerContext
    ) -> knowledge_pb2.GetAgentMessagesResponse:
        try:
            res = await self.chat_service.get_history(
                tenant_id=request.tenant_id,
                agent_id=request.agent_id,
                before_iso=request.before if request.before else None,
                limit=request.limit if request.limit > 0 else 20,
            )
            proto_msgs = [
                knowledge_pb2.ChatMessageInfo(
                    id=m.id,
                    tenant_id=m.tenant_id,
                    agent_id=m.agent_id,
                    role=m.role,
                    content=m.content,
                    created_at=m.created_at,
                )
                for m in res.messages
            ]
            return knowledge_pb2.GetAgentMessagesResponse(
                messages=proto_msgs,
                next_cursor=res.next_cursor,
                has_more=res.has_more,
            )
        except Exception as e:
            print(f"[gRPC Error] GetAgentMessages failed: {e}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(f"GET_MESSAGES_ERROR: {str(e)}")
            return knowledge_pb2.GetAgentMessagesResponse()
