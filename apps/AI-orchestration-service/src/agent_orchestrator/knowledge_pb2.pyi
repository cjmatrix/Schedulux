from google.protobuf.internal import containers as _containers
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Iterable as _Iterable, Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class CrawlSiteRequest(_message.Message):
    __slots__ = ("tenant_id", "url")
    TENANT_ID_FIELD_NUMBER: _ClassVar[int]
    URL_FIELD_NUMBER: _ClassVar[int]
    tenant_id: str
    url: str
    def __init__(self, tenant_id: _Optional[str] = ..., url: _Optional[str] = ...) -> None: ...

class CrawlSiteResponse(_message.Message):
    __slots__ = ("message", "job_id", "status")
    MESSAGE_FIELD_NUMBER: _ClassVar[int]
    JOB_ID_FIELD_NUMBER: _ClassVar[int]
    STATUS_FIELD_NUMBER: _ClassVar[int]
    message: str
    job_id: str
    status: str
    def __init__(self, message: _Optional[str] = ..., job_id: _Optional[str] = ..., status: _Optional[str] = ...) -> None: ...

class GetCrawlStatusRequest(_message.Message):
    __slots__ = ("tenant_id", "job_id")
    TENANT_ID_FIELD_NUMBER: _ClassVar[int]
    JOB_ID_FIELD_NUMBER: _ClassVar[int]
    tenant_id: str
    job_id: str
    def __init__(self, tenant_id: _Optional[str] = ..., job_id: _Optional[str] = ...) -> None: ...

class CrawlPageResult(_message.Message):
    __slots__ = ("url", "markdown", "success", "error")
    URL_FIELD_NUMBER: _ClassVar[int]
    MARKDOWN_FIELD_NUMBER: _ClassVar[int]
    SUCCESS_FIELD_NUMBER: _ClassVar[int]
    ERROR_FIELD_NUMBER: _ClassVar[int]
    url: str
    markdown: str
    success: bool
    error: str
    def __init__(self, url: _Optional[str] = ..., markdown: _Optional[str] = ..., success: _Optional[bool] = ..., error: _Optional[str] = ...) -> None: ...

class GetCrawlStatusResponse(_message.Message):
    __slots__ = ("job_id", "status", "pages_crawled", "pages")
    JOB_ID_FIELD_NUMBER: _ClassVar[int]
    STATUS_FIELD_NUMBER: _ClassVar[int]
    PAGES_CRAWLED_FIELD_NUMBER: _ClassVar[int]
    PAGES_FIELD_NUMBER: _ClassVar[int]
    job_id: str
    status: str
    pages_crawled: int
    pages: _containers.RepeatedCompositeFieldContainer[CrawlPageResult]
    def __init__(self, job_id: _Optional[str] = ..., status: _Optional[str] = ..., pages_crawled: _Optional[int] = ..., pages: _Optional[_Iterable[_Union[CrawlPageResult, _Mapping]]] = ...) -> None: ...
