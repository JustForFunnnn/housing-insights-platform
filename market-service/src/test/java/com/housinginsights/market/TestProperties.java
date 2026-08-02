package com.housinginsights.market;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.housinginsights.market.domain.Property;
import com.housinginsights.market.metadata.PropertyMetadata;
import java.nio.file.Path;
import java.util.List;

public final class TestProperties {
    public static final List<Property> PROPERTIES = List.of(
            new Property(1, 1000, 2, 1, 1985, 5000, 2, 7, 150000),
            new Property(2, 1500, 3, 2, 1995, 6500, 4, 8, 250000),
            new Property(3, 2000, 3, 2.5, 2005, 8000, 6, 8.5, 350000),
            new Property(4, 2400, 4, 3, 2015, 10000, 8, 9, 450000));

    public static PropertyMetadata propertyMetadata() {
        return PropertyMetadata.load(Path.of("..", "contracts", "property-metadata.json"), new ObjectMapper());
    }

    private TestProperties() {}
}
