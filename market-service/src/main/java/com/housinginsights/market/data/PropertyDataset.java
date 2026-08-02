package com.housinginsights.market.data;

import com.housinginsights.market.domain.Property;
import com.housinginsights.market.error.DatasetLoadingException;
import java.util.List;

public record PropertyDataset(List<Property> properties) {
    public PropertyDataset {
        properties = List.copyOf(properties);
        if (properties.isEmpty()) {
            throw new DatasetLoadingException("dataset must contain at least one property");
        }
    }
}
