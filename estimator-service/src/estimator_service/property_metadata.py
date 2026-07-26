from housing_common.property_metadata import (
    PropertyFeatureMetadata,
    PropertyMetadataWithCurrency as PropertyMetadata,
)

from estimator_service.settings import Settings


PROPERTY_METADATA = PropertyMetadata.load(Settings().property_metadata_path)
