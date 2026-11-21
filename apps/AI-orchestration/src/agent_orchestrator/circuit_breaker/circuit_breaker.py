import logging
from datetime import timedelta
from typing import Any

import grpc
from aiobreaker import CircuitBreaker, CircuitBreakerListener

logger = logging.getLogger(__name__)


def is_grpc_client_error(exc: Exception) -> bool:
  
    if isinstance(exc, grpc.RpcError):
        code = exc.code()
        if code in (
            grpc.StatusCode.INVALID_ARGUMENT,
            grpc.StatusCode.NOT_FOUND,
            grpc.StatusCode.ALREADY_EXISTS,
            grpc.StatusCode.PERMISSION_DENIED,
            grpc.StatusCode.FAILED_PRECONDITION,
            grpc.StatusCode.UNAUTHENTICATED,
        ):
            return True
    return False


class LoggingCircuitBreakerListener(CircuitBreakerListener):
    

    def state_change(self, breaker: CircuitBreaker, old: Any, new: Any) -> None:
        old_name = old.state.name if hasattr(old, "state") else str(old)
        new_name = new.state.name if hasattr(new, "state") else str(new)
        logger.warning(
            "[CircuitBreaker] Breaker '%s' transitioned: %s -> %s",
            breaker.name,
            old_name,
            new_name,
        )


_breakers_registry: dict[str, CircuitBreaker] = {}


def get_circuit_breaker(
    name: str,
    failure_threshold: int = 5,
    recovery_timeout: float = 10.0,
) -> CircuitBreaker:
    
    if name not in _breakers_registry:
        _breakers_registry[name] = CircuitBreaker(
            fail_max=failure_threshold,
            timeout_duration=timedelta(seconds=recovery_timeout),
            exclude=[is_grpc_client_error],
            listeners=[LoggingCircuitBreakerListener()],
            name=name,
        )
    return _breakers_registry[name]
