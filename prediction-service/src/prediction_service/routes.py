from typing import Annotated

from fastapi import APIRouter, Depends, Request

from prediction_service.prediction import PredictionService
from prediction_service.schemas import (
    HealthResponse,
    ModelInfoResponse,
    PredictionRequest,
    PredictionResponse,
)

router = APIRouter()


def get_prediction_service(request: Request) -> PredictionService:
    return request.app.state.prediction_service


@router.post("/predict", response_model=PredictionResponse)
def predict_prices(
    payload: PredictionRequest,
    service: PredictionService = Depends(get_prediction_service),
) -> PredictionResponse:
    predictions = service.predict(
        [instance.to_features() for instance in payload.instances]
    )
    return PredictionResponse(predictions=predictions, count=len(predictions))


@router.get("/model-info", response_model=ModelInfoResponse)
def model_information(service: PredictionService = Depends(get_prediction_service)) -> ModelInfoResponse:
    return ModelInfoResponse.model_validate(service.model_info())


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok")
