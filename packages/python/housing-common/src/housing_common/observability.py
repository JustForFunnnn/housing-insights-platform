from __future__ import annotations

import logging
from collections.abc import Awaitable, Callable
from uuid import uuid4

from asgi_correlation_id import CorrelationIdFilter, correlation_id
from starlette.middleware.base import RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

RequestLoggingMiddleware = Callable[
    [Request, RequestResponseEndpoint],
    Awaitable[Response],
]


def configure_logging(package_name: str) -> None:
    logging.basicConfig(
        level=logging.INFO,
        format=(
            "%(asctime)s %(levelname)s request_id=%(correlation_id)s "
            "%(name)s %(message)s"
        ),
    )
    for handler in logging.getLogger().handlers:
        if not any(
            isinstance(log_filter, CorrelationIdFilter)
            for log_filter in handler.filters
        ):
            handler.addFilter(CorrelationIdFilter(default_value="-"))
    logging.getLogger(package_name).setLevel(logging.INFO)


def current_request_id() -> str:
    request_id = correlation_id.get()
    if request_id is not None:
        return request_id
    request_id = uuid4().hex
    correlation_id.set(request_id)
    return request_id


def create_request_logging_middleware(
    logger_name: str,
) -> RequestLoggingMiddleware:
    logger = logging.getLogger(logger_name)

    async def log_request(
        request: Request,
        call_next: RequestResponseEndpoint,
    ) -> Response:
        response = await call_next(request)
        logger.info(
            "request_completed method=%s path=%s status=%d",
            request.method,
            request.url.path,
            response.status_code,
        )
        return response

    return log_request
