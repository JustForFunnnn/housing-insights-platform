class EstimateNotFoundError(LookupError):
    """Raised when an estimate identifier does not exist."""


class PredictionServiceUnavailableError(RuntimeError):
    """Raised when the prediction service cannot currently serve a request."""


class PredictionServiceInvalidResponseError(RuntimeError):
    """Raised when the prediction service violates its expected contract."""


class StorageError(RuntimeError):
    """Raised when a database operation fails for an internal reason."""


class StorageUnavailableError(StorageError):
    """Raised when the SQLite database cannot currently be used."""
