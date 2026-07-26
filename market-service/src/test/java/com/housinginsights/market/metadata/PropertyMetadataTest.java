package com.housinginsights.market.metadata;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.housinginsights.market.domain.PropertyFieldNames;
import com.housinginsights.market.error.InvalidRequestException;
import com.housinginsights.market.error.PropertyMetadataException;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class PropertyMetadataTest {
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void loadsOnceAsImmutableStartupSnapshot(@TempDir Path directory) throws IOException {
        ObjectNode root = contract();
        root.put("price_currency", "fixture_currency");
        Path path = directory.resolve("property-metadata.json");
        objectMapper.writeValue(path.toFile(), root);

        PropertyMetadata metadata = PropertyMetadata.load(path, objectMapper);
        Files.writeString(path, "{}");

        assertThat(metadata.features().keySet()).containsExactlyElementsOf(PropertyFieldNames.FEATURE_COLUMNS);
        assertThat(metadata.priceCurrency()).isEqualTo("fixture_currency");
    }

    @Test
    void rejectsMissingOrInvalidMetadataAndIgnoresExtraFields(@TempDir Path directory) throws IOException {
        assertThatThrownBy(() -> PropertyMetadata.load(directory.resolve("missing.json"), objectMapper))
                .isInstanceOf(PropertyMetadataException.class);

        ObjectNode root = contract();
        feature(root, PropertyFieldNames.BATHROOMS).put("min", 2).put("max", 1);
        Path invalid = directory.resolve("invalid.json");
        objectMapper.writeValue(invalid.toFile(), root);

        assertThatThrownBy(() -> PropertyMetadata.load(invalid, objectMapper))
                .isInstanceOf(PropertyMetadataException.class);

        ObjectNode coercible = contract();
        feature(coercible, PropertyFieldNames.BATHROOMS).put("min", "0");
        objectMapper.writeValue(invalid.toFile(), coercible);
        assertThatThrownBy(() -> PropertyMetadata.load(invalid, objectMapper))
                .isInstanceOf(PropertyMetadataException.class);

        ObjectNode extraField = contract();
        feature(extraField, PropertyFieldNames.BEDROOMS).put("unexpected", 1);
        extraField.put("unexpected", true);
        objectMapper.writeValue(invalid.toFile(), extraField);
        assertThat(PropertyMetadata.load(invalid, objectMapper).features().keySet())
                .containsExactlyElementsOf(PropertyFieldNames.FEATURE_COLUMNS);
    }

    @Test
    void validatorAppliesConfiguredBounds() {
        var bounded = new PropertyFeatureMetadata(BigDecimal.ONE, BigDecimal.TEN, null);
        bounded.validate("bathrooms", 2);
        assertThatThrownBy(() -> bounded.validate("bathrooms", 11))
                .isInstanceOf(InvalidRequestException.class)
                .hasMessageContaining("range");
    }

    private ObjectNode contract() throws IOException {
        return (ObjectNode) objectMapper.readTree(contractPath().toFile());
    }

    private static ObjectNode feature(ObjectNode root, String name) {
        return (ObjectNode) root.get("features").get(name);
    }

    private static Path contractPath() {
        return Path.of("..", "contracts", "property-metadata.json");
    }
}
