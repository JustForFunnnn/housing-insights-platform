from typing import Annotated

from fastapi import APIRouter, Depends, Header, Request

from prediction_service import schemas
from prediction_service.constants import REQUEST_ID_HEADER
from prediction_service.prediction import PredictionService

RESPONSE_WITH_REQUEST_ID = {
    "headers": {
        REQUEST_ID_HEADER: {
            "description": "The active request correlation identifier.",
            "schema": {"type": "string"},
        }
    }
}
ERROR_RESPONSE_WITH_REQUEST_ID = {
    "model": schemas.ErrorResponse,
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
    },
)


def get_prediction_service(request: Request) -> PredictionService:
    return request.app.state.prediction_service


@router.post(
    "/predict",
    response_model=schemas.PredictionResponse,
    responses={
        200: RESPONSE_WITH_REQUEST_ID,
        422: ERROR_RESPONSE_WITH_REQUEST_ID,
    },
)
def predict_prices(
    payload: schemas.PredictionRequest,
    service: PredictionService = Depends(get_prediction_service),
) -> schemas.PredictionResponse:
    predictions = service.predict([property_input.to_features() for property_input in payload.properties])
    return schemas.PredictionResponse(predictions=predictions)


@router.get(
    "/model-info",
    response_model=schemas.ModelInfoResponse,
    responses={
        200: RESPONSE_WITH_REQUEST_ID,
        422: ERROR_RESPONSE_WITH_REQUEST_ID,
    },
)
def model_information(
    service: PredictionService = Depends(get_prediction_service),
) -> schemas.ModelInfoResponse:
    return schemas.ModelInfoResponse.model_validate(service.model_info())


@router.get(
    "/health",
    response_model=schemas.HealthResponse,
    responses={
        200: RESPONSE_WITH_REQUEST_ID,
        422: ERROR_RESPONSE_WITH_REQUEST_ID,
    },
)
def health() -> schemas.HealthResponse:
    return schemas.HealthResponse(status="ok")
