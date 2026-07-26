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
    private static final Set<String> FEATURE_KEYS = Set.of("min", "max", "unit");
    private static final String PRICE_CURRENCY_KEY = "price_currency";

    private final Map<String, PropertyFeatureMetadata> features;
    private final String priceCurrency;

    private PropertyMetadata(Map<String, PropertyFeatureMetadata> features, String priceCurrency) {
        this.features = Collections.unmodifiableMap(new LinkedHashMap<>(features));
        this.priceCurrency = priceCurrency;
    }

    public static PropertyMetadata load(Path path, ObjectMapper objectMapper) {
        if (path == null || !Files.isRegularFile(path) || !Files.isReadable(path)) {
            throw new PropertyMetadataException("property metadata is missing or unreadable");
        }

        final JsonNode root;
        try {
            root = objectMapper.readTree(path.toFile());
        } catch (IOException exception) {
            throw new PropertyMetadataException("property metadata could not be read", exception);
        }
        JsonNode featuresNode = root == null ? null : root.get("features");
        if (root == null
                || !root.isObject()
                || featuresNode == null
                || !featuresNode.isObject()
                || !PropertyFieldNames.FEATURE_COLUMNS.stream().allMatch(featuresNode::has)
                || !root.has(PRICE_CURRENCY_KEY)) {
            throw new PropertyMetadataException("property metadata must contain the supported features");
        }

        Map<String, PropertyFeatureMetadata> features = new LinkedHashMap<>();
        for (String name : PropertyFieldNames.FEATURE_COLUMNS) {
            JsonNode featureNode = featuresNode.get(name);
            if (featureNode == null
                    || !featureNode.isObject()
                    || !FEATURE_KEYS.stream().allMatch(featureNode::has)
                    || !hasExpectedValueTypes(featureNode)) {
                throw new PropertyMetadataException("metadata for " + name + " must contain min, max, and unit");
            }
            PropertyFeatureMetadata feature = parseFeature(name, featureNode);
            features.put(name, feature);
        }
        return new PropertyMetadata(features, parsePriceCurrency(root.get(PRICE_CURRENCY_KEY)));
    }

    public Map<String, PropertyFeatureMetadata> features() {
        return features;
    }

    public String priceCurrency() {
        return priceCurrency;
    }

    public void validate(PropertyFeatures features) {
        validate(PropertyFieldNames.SQUARE_FOOTAGE, features.squareFootage());
        validate(PropertyFieldNames.BEDROOMS, features.bedrooms());
        validate(PropertyFieldNames.BATHROOMS, features.bathrooms());
        validate(PropertyFieldNames.YEAR_BUILT, features.yearBuilt());
        validate(PropertyFieldNames.LOT_SIZE, features.lotSize());
        validate(PropertyFieldNames.DISTANCE_TO_CITY_CENTER, features.distanceToCityCenter());
        validate(PropertyFieldNames.SCHOOL_RATING, features.schoolRating());
    }

    public void validate(MarketFilter filter) {
        validateNullable(PropertyFieldNames.SQUARE_FOOTAGE, filter.minSquareFootage());
        validateNullable(PropertyFieldNames.SQUARE_FOOTAGE, filter.maxSquareFootage());
        filter.bedrooms().forEach(value -> validate(PropertyFieldNames.BEDROOMS, value));
        filter.bathrooms().forEach(value -> validate(PropertyFieldNames.BATHROOMS, value));
        validateNullable(PropertyFieldNames.YEAR_BUILT, filter.minYearBuilt());
        validateNullable(PropertyFieldNames.YEAR_BUILT, filter.maxYearBuilt());
        validateNullable(PropertyFieldNames.LOT_SIZE, filter.minLotSize());
        validateNullable(PropertyFieldNames.LOT_SIZE, filter.maxLotSize());
        validateNullable(PropertyFieldNames.DISTANCE_TO_CITY_CENTER, filter.minDistanceToCityCenter());
        validateNullable(PropertyFieldNames.DISTANCE_TO_CITY_CENTER, filter.maxDistanceToCityCenter());
        validateNullable(PropertyFieldNames.SCHOOL_RATING, filter.minSchoolRating());
        validateNullable(PropertyFieldNames.SCHOOL_RATING, filter.maxSchoolRating());
    }

    private static PropertyFeatureMetadata parseFeature(String name, JsonNode node) {
        try {
            JsonNode minimum = node.get("min");
            JsonNode maximum = node.get("max");
            JsonNode unit = node.get("unit");
            return new PropertyFeatureMetadata(
                    minimum.decimalValue(), maximum.decimalValue(), unit.isNull() ? null : unit.textValue());
        } catch (IllegalArgumentException exception) {
            throw new PropertyMetadataException("metadata for " + name + " is invalid", exception);
        }
    }

    private static String parsePriceCurrency(JsonNode node) {
        if (node == null || !node.isTextual()) {
            throw new PropertyMetadataException("price_currency must be a string");
        }
        return node.textValue();
    }

    private void validateNullable(String name, Number value) {
        if (value != null) {
            validate(name, value);
        }
    }

    private void validate(String name, Number value) {
        features.get(name).validate(name, value);
    }

    private static boolean hasExpectedValueTypes(JsonNode node) {
        JsonNode unit = node.get("unit");
        return node.get("min").isNumber() && node.get("max").isNumber() && (unit.isNull() || unit.isTextual());
    }
}
