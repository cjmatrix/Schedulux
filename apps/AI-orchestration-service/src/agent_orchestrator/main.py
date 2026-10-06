import asyncio
from agent_orchestrator.grpc_server import serve

def main():
    print("[AI Orchestrator Service] Starting native Async gRPC server...")
    try:
        asyncio.run(serve())
    except KeyboardInterrupt:
        print("[AI Orchestrator Service] Shutting down gracefully.")

if __name__ == "__main__":
    main()
