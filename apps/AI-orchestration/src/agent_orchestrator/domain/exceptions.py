class AgentNotFoundException(Exception):
    pass


class CrawlJobNotFoundException(Exception):
    pass


class InvalidDraftException(Exception):
    pass


class TierQuotaExceededException(Exception):
    pass


class PermanentMemoryError(Exception):
    """Raised when memory consolidation encounters an unrecoverable, permanent error (e.g. malformed data, 401 auth)."""
    pass
