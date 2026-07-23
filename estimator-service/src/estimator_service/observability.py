from __future__ import annotations

import logging
from uuid import uuid4

from fastapi import Request, Response
from starlette.middleware.base import RequestResponseEndpoint

from estimator_service.constants import REQUEST_ID_HEADER

LOGGER = logging.getLogger(__name__)


def configure_logging() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )
    logging.getLogger("estimator_service").setLevel(logging.INFO)


def request_id_from_request(request: Request) -> str:
    request_id = getattr(request.state, "request_id", None)
    if isinstance(request_id, str):
        return request_id
    request_id = uuid4().hex
    request.state.request_id = request_id
    return request_id


async def correlate_request(
    request: Request,
    call_next: RequestResponseEndpoint,
) -> Response:
    request_id = request.headers.get(REQUEST_ID_HEADER) or uuid4().hex
    request.state.request_id = request_id
    response = await call_next(request)
    response.headers[REQUEST_ID_HEADER] = request_id
    LOGGER.info(
        "request_completed request_id=%s method=%s path=%s status=%d",
        request_id,
        request.method,
        request.url.path,
        response.status_code,
    )
    return response
