import asyncio
from agent_orchestrator.grpc_server import serve

def main():
    print("[AI Orchestrator Service] Starting native Async gRPC server...", flush=True)
    try:
        asyncio.run(serve())
    except KeyboardInterrupt:
        print("[AI Orchestrator Service] Shutting down gracefully.", flush=True)

if __name__ == "__main__":
    main()
