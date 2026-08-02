from housing_common import property_metadata

from prediction_service.settings import Settings

PROPERTY_METADATA = property_metadata.PropertyMetadata.load(Settings().property_metadata_path)
