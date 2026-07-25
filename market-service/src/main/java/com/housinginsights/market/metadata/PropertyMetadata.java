package com.housinginsights.market.metadata;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.housinginsights.market.domain.MarketFilter;
import com.housinginsights.market.domain.PropertyFeatures;
import com.housinginsights.market.domain.PropertyFieldNames;
import com.housinginsights.market.error.PropertyMetadataException;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

public final class PropertyMetadata {
    private static final Set<String> FIELD_KEYS = Set.of("min", "max", "unit");
    private static final Set<String> FEATURE_FIELDS =
            Set.copyOf(PropertyFieldNames.FEATURE_COLUMNS);

    private final Map<String, PropertyFieldMetadata> fields;

    private PropertyMetadata(Map<String, PropertyFieldMetadata> fields) {
        this.fields =
                Collections.unmodifiableMap(new LinkedHashMap<>(fields));
    }

    public static PropertyMetadata load(Path path, ObjectMapper objectMapper) {
        if (path == null || !Files.isRegularFile(path) || !Files.isReadable(path)) {
            throw new PropertyMetadataException(
                    "property metadata is missing or unreadable");
        }

        final JsonNode root;
        try {
            root = objectMapper.readTree(path.toFile());
        } catch (IOException exception) {
            throw new PropertyMetadataException(
                    "property metadata could not be read", exception);
        }
        if (root == null
                || !root.isObject()
                || !FEATURE_FIELDS.stream().allMatch(root::has)) {
            throw new PropertyMetadataException(
                    "property metadata must contain the supported feature fields");
        }

        Map<String, PropertyFieldMetadata> fields = new LinkedHashMap<>();
        for (String name : PropertyFieldNames.FEATURE_COLUMNS) {
            JsonNode fieldNode = root.get(name);
            if (fieldNode == null
                    || !fieldNode.isObject()
                    || !FIELD_KEYS.stream().allMatch(fieldNode::has)
                    || !hasExpectedValueTypes(fieldNode)) {
                throw new PropertyMetadataException(
                        "metadata for "
                                + name
                                + " must contain min, max, and unit");
            }
            PropertyFieldMetadata field = parseField(name, fieldNode);
            fields.put(name, field);
        }
        return new PropertyMetadata(fields);
    }

    public Map<String, PropertyFieldMetadata> fields() {
        return fields;
    }

    public void validate(PropertyFeatures features) {
        validate(PropertyFieldNames.SQUARE_FOOTAGE, features.squareFootage());
        validate(PropertyFieldNames.BEDROOMS, features.bedrooms());
        validate(PropertyFieldNames.BATHROOMS, features.bathrooms());
        validate(PropertyFieldNames.YEAR_BUILT, features.yearBuilt());
        validate(PropertyFieldNames.LOT_SIZE, features.lotSize());
        validate(
                PropertyFieldNames.DISTANCE_TO_CITY_CENTER,
                features.distanceToCityCenter());
        validate(PropertyFieldNames.SCHOOL_RATING, features.schoolRating());
    }

    public void validate(MarketFilter filter) {
        validateNullable(
                PropertyFieldNames.SQUARE_FOOTAGE,
                filter.minSquareFootage());
        validateNullable(
                PropertyFieldNames.SQUARE_FOOTAGE,
                filter.maxSquareFootage());
        filter.bedrooms()
                .forEach(value ->
                        validate(PropertyFieldNames.BEDROOMS, value));
        filter.bathrooms()
                .forEach(value ->
                        validate(PropertyFieldNames.BATHROOMS, value));
        validateNullable(
                PropertyFieldNames.YEAR_BUILT, filter.minYearBuilt());
        validateNullable(
                PropertyFieldNames.YEAR_BUILT, filter.maxYearBuilt());
        validateNullable(PropertyFieldNames.LOT_SIZE, filter.minLotSize());
        validateNullable(PropertyFieldNames.LOT_SIZE, filter.maxLotSize());
        validateNullable(
                PropertyFieldNames.DISTANCE_TO_CITY_CENTER,
                filter.minDistanceToCityCenter());
        validateNullable(
                PropertyFieldNames.DISTANCE_TO_CITY_CENTER,
                filter.maxDistanceToCityCenter());
        validateNullable(
                PropertyFieldNames.SCHOOL_RATING,
                filter.minSchoolRating());
        validateNullable(
                PropertyFieldNames.SCHOOL_RATING,
                filter.maxSchoolRating());
    }

    private static PropertyFieldMetadata parseField(
            String name, JsonNode node) {
        try {
            JsonNode unit = node.get("unit");
            return new PropertyFieldMetadata(
                    node.get("min").decimalValue(),
                    node.get("max").decimalValue(),
                    unit.isNull() ? null : unit.textValue());
        } catch (IllegalArgumentException exception) {
            throw new PropertyMetadataException(
                    "metadata for " + name + " is invalid", exception);
        }
    }

    private void validateNullable(String name, Number value) {
        if (value != null) {
            validate(name, value);
        }
    }

    private void validate(String name, Number value) {
        fields.get(name).validate(name, value);
    }

    private static boolean hasExpectedValueTypes(JsonNode node) {
        JsonNode unit = node.get("unit");
        return node.get("min").isNumber()
                && node.get("max").isNumber()
                && (unit.isNull() || unit.isTextual());
    }
}
