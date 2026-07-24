from typing import Annotated

from fastapi import APIRouter, Depends, Header, Request

from prediction_service.constants import REQUEST_ID_HEADER
from prediction_service.prediction import PredictionService
from prediction_service.schemas import (
    ErrorResponse,
    HealthResponse,
    ModelInfoResponse,
    PredictionRequest,
    PredictionResponse,
)

RESPONSE_WITH_REQUEST_ID = {
    "headers": {
        REQUEST_ID_HEADER: {
            "description": "The active request correlation identifier.",
            "schema": {"type": "string"},
        }
    }
}
ERROR_RESPONSE_WITH_REQUEST_ID = {
    "model": ErrorResponse,
    **RESPONSE_WITH_REQUEST_ID,
}


def document_request_id(
    _request_id: Annotated[
        str | None,
        Header(
            alias=REQUEST_ID_HEADER,
            description=(
                "Optional UUID4 request identifier. Valid values are preserved "
                "exactly; missing or invalid values are replaced with a compact "
                "UUID4."
            ),
        ),
    ] = None,
) -> None:
    """Expose middleware-owned request correlation in OpenAPI."""


router = APIRouter(
    dependencies=[Depends(document_request_id)],
    responses={
        500: {
            **ERROR_RESPONSE_WITH_REQUEST_ID,
            "description": "The request could not be completed.",
        }
    }
)


def get_prediction_service(request: Request) -> PredictionService:
    return request.app.state.prediction_service


@router.post(
    "/predict",
    response_model=PredictionResponse,
    responses={
        200: RESPONSE_WITH_REQUEST_ID,
        422: ERROR_RESPONSE_WITH_REQUEST_ID,
    },
)
def predict_prices(
    payload: PredictionRequest,
    service: PredictionService = Depends(get_prediction_service),
) -> PredictionResponse:
    predictions = service.predict(
        [instance.to_features() for instance in payload.instances]
    )
    return PredictionResponse(predictions=predictions)


@router.get(
    "/model-info",
    response_model=ModelInfoResponse,
    responses={
        200: RESPONSE_WITH_REQUEST_ID,
        422: ERROR_RESPONSE_WITH_REQUEST_ID,
    },
)
def model_information(service: PredictionService = Depends(get_prediction_service)) -> ModelInfoResponse:
    return ModelInfoResponse.model_validate(service.model_info())


@router.get(
    "/health",
    response_model=HealthResponse,
    responses={
        200: RESPONSE_WITH_REQUEST_ID,
        422: ERROR_RESPONSE_WITH_REQUEST_ID,
    },
)
def health() -> HealthResponse:
    return HealthResponse(status="ok")
