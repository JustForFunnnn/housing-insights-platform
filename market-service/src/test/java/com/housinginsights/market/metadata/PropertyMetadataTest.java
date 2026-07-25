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
    void loadsOnceAsImmutableStartupSnapshot(@TempDir Path directory)
            throws IOException {
        ObjectNode root = contract();
        field(root, PropertyFieldNames.PRICE)
                .putNull("min")
                .putNull("max")
                .put("unit", "fixture_currency");
        Path path = directory.resolve("property-field-metadata.json");
        objectMapper.writeValue(path.toFile(), root);

        PropertyMetadata metadata = PropertyMetadata.load(path, objectMapper);
        Files.writeString(path, "{}");

        assertThat(metadata.fields().keySet())
                .containsExactlyElementsOf(PropertyFieldNames.METADATA_FIELDS);
        assertThat(metadata.fields().get("price").min()).isNull();
        assertThat(metadata.fields().get("price").max()).isNull();
        assertThat(metadata.fields().get("price").unit())
                .isEqualTo("fixture_currency");
    }

    @Test
    void rejectsMissingOrInvalidMetadataAndIgnoresExtraFields(
            @TempDir Path directory)
            throws IOException {
        assertThatThrownBy(() -> PropertyMetadata.load(
                        directory.resolve("missing.json"), objectMapper))
                .isInstanceOf(PropertyMetadataException.class);

        ObjectNode root = contract();
        field(root, PropertyFieldNames.BATHROOMS)
                .put("min", 2)
                .put("max", 1);
        Path invalid = directory.resolve("invalid.json");
        objectMapper.writeValue(invalid.toFile(), root);

        assertThatThrownBy(() -> PropertyMetadata.load(invalid, objectMapper))
                .isInstanceOf(PropertyMetadataException.class);

        ObjectNode coercible = contract();
        field(coercible, PropertyFieldNames.BATHROOMS).put("min", "0");
        objectMapper.writeValue(invalid.toFile(), coercible);
        assertThatThrownBy(() -> PropertyMetadata.load(invalid, objectMapper))
                .isInstanceOf(PropertyMetadataException.class);

        ObjectNode extraField = contract();
        field(extraField, PropertyFieldNames.BEDROOMS).put("unexpected", 1);
        extraField.put("unexpected", true);
        objectMapper.writeValue(invalid.toFile(), extraField);
        assertThat(PropertyMetadata.load(invalid, objectMapper)
                        .fields()
                        .keySet())
                .containsExactlyElementsOf(PropertyFieldNames.METADATA_FIELDS);
    }

    @Test
    void validatorAppliesOnlyConfiguredBounds() {
        var minimumOnly =
                new PropertyFieldMetadata(BigDecimal.ONE, null, null);
        minimumOnly.validate("price", 2);
        assertThatThrownBy(() -> minimumOnly.validate("price", 0))
                .isInstanceOf(InvalidRequestException.class)
                .hasMessageContaining("range");

        var maximumOnly =
                new PropertyFieldMetadata(null, BigDecimal.TEN, null);
        maximumOnly.validate("price", 9);
        assertThatThrownBy(() -> maximumOnly.validate("price", 11))
                .isInstanceOf(InvalidRequestException.class)
                .hasMessageContaining("range");

        var unbounded = new PropertyFieldMetadata(null, null, null);
        unbounded.validate("price", Long.MIN_VALUE);
        unbounded.validate("price", Long.MAX_VALUE);
    }

    private ObjectNode contract() throws IOException {
        return (ObjectNode) objectMapper.readTree(contractPath().toFile());
    }

    private static ObjectNode field(ObjectNode root, String name) {
        return (ObjectNode) root.get(name);
    }

    private static Path contractPath() {
        return Path.of(
                "..", "contracts", "property-field-metadata.json");
    }
}
