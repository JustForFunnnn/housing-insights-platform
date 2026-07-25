package com.housinginsights.market;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.housinginsights.market.domain.PropertyRecord;
import com.housinginsights.market.metadata.PropertyMetadata;
import java.nio.file.Path;
import java.util.List;

public final class TestProperties {
    public static final List<PropertyRecord> RECORDS = List.of(
            new PropertyRecord(1, 1000, 2, 1, 1985, 5000, 2, 7, 150000),
            new PropertyRecord(2, 1500, 3, 2, 1995, 6500, 4, 8, 250000),
            new PropertyRecord(3, 2000, 3, 2.5, 2005, 8000, 6, 8.5, 350000),
            new PropertyRecord(4, 2400, 4, 3, 2015, 10000, 8, 9, 450000));

    public static PropertyMetadata propertyMetadata() {
        return PropertyMetadata.load(
                Path.of("..", "contracts", "property-field-metadata.json"),
                new ObjectMapper());
    }

    private TestProperties() {}
}
