from housing_common.property_metadata import PropertyMetadata

from prediction_service.settings import Settings


PROPERTY_METADATA = PropertyMetadata.load(Settings().property_metadata_path)
