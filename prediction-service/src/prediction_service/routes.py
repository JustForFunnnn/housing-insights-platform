from typing import Annotated

from fastapi import APIRouter, Depends, Request

from prediction_service.models import MetricSummary
from prediction_service.prediction import PredictionService
from prediction_service.schemas import (
    CrossValidationResponse,
    ErrorMetricSummaryResponse,
    HealthResponse,
    MetricSummaryResponse,
    ModelInfoResponse,
    PredictionRequest,
    PredictionResponse,
    RegressionMetricsResponse,
)

router = APIRouter()


def get_prediction_service(request: Request) -> PredictionService:
    return request.app.state.prediction_service


PredictionServiceDependency = Annotated[
    PredictionService,
    Depends(get_prediction_service),
]


@router.post("/predict", response_model=PredictionResponse)
def predict_prices(
    payload: PredictionRequest,
    service: PredictionServiceDependency,
) -> PredictionResponse:
    predictions = service.predict(
        [instance.to_domain() for instance in payload.instances]
    )
    return PredictionResponse(predictions=predictions, count=len(predictions))


@router.get("/model-info", response_model=ModelInfoResponse)
def model_information(service: PredictionServiceDependency) -> ModelInfoResponse:
    info = service.model_info()
    metrics = info.cross_validation.metrics
    return ModelInfoResponse(
        training_timestamp=info.training_timestamp,
        algorithm=info.algorithm,
        features=list(info.features),
        intercept=info.intercept,
        coefficients=info.coefficients,
        cross_validation=CrossValidationResponse(
            folds=info.cross_validation.folds,
            shuffle=info.cross_validation.shuffle,
            random_state=info.cross_validation.random_state,
            metrics=RegressionMetricsResponse(
                r2=_metric_response(metrics.r2),
                rmse=_error_metric_response(metrics.rmse),
                mae=_error_metric_response(metrics.mae),
            ),
        ),
    )


def _metric_response(metric: MetricSummary) -> MetricSummaryResponse:
    return MetricSummaryResponse(mean=metric.mean, std=metric.std)


def _error_metric_response(metric: MetricSummary) -> ErrorMetricSummaryResponse:
    return ErrorMetricSummaryResponse(mean=metric.mean, std=metric.std)


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok")
