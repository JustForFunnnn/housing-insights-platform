from __future__ import annotations

import logging
from uuid import uuid4

from asgi_correlation_id import CorrelationIdFilter, correlation_id
from fastapi import Request, Response
from starlette.middleware.base import RequestResponseEndpoint

LOGGER = logging.getLogger(__name__)


def configure_logging() -> None:
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
    logging.getLogger("estimator_service").setLevel(logging.INFO)


def current_request_id() -> str:
    request_id = correlation_id.get()
    if request_id is not None:
        return request_id
    request_id = uuid4().hex
    correlation_id.set(request_id)
    return request_id


async def log_request(
    request: Request,
    call_next: RequestResponseEndpoint,
) -> Response:
    response = await call_next(request)
    LOGGER.info(
        "request_completed method=%s path=%s status=%d",
        request.method,
        request.url.path,
        response.status_code,
    )
    return response
