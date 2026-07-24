package com.housinginsights.market.data;

import com.housinginsights.market.domain.PropertyRecord;
import java.util.List;

public record PropertyDataset(List<PropertyRecord> properties) {
    public PropertyDataset {
        properties = List.copyOf(properties);
        if (properties.isEmpty()) {
            throw new DatasetLoadingException("dataset must contain at least one record");
        }
    }
}
