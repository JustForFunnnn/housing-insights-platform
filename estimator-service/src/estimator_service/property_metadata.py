from housing_common import property_metadata

from estimator_service.settings import Settings

PROPERTY_METADATA = property_metadata.PropertyMetadata.load(Settings().property_metadata_path)
