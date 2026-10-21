from __future__ import annotations

import sys
from pathlib import Path

# Ensure proto directory is in sys.path so generated *_grpc.py files can import their *_pb2 counterparts
_proto_dir = str(Path(__file__).parent)
if _proto_dir not in sys.path:
    sys.path.insert(0, _proto_dir)

from agent_orchestrator.proto import (  # noqa: E402
    knowledge_pb2,
    knowledge_pb2_grpc,
    scheduling_pb2,
    scheduling_pb2_grpc,
)

__all__ = [
    "knowledge_pb2",
    "knowledge_pb2_grpc",
    "scheduling_pb2",
    "scheduling_pb2_grpc",
]
