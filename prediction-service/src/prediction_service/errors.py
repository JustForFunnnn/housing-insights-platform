class ArtifactError(RuntimeError):
    """Raised when a model artifact cannot be read, validated, or written."""


class PredictionError(RuntimeError):
    """Raised when the fitted model cannot produce a valid complete batch."""


class TrainingError(ValueError):
    """Raised when the training data cannot produce a useful model."""
