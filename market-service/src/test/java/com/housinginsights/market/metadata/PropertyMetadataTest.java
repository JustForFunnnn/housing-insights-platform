package com.housinginsights.market.metadata;

import static com.housinginsights.market.TestProperties.RECORDS;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.housinginsights.market.error.PropertyMetadataException;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class PropertyMetadataTest {
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void loadsOnceAsImmutableStartupSnapshot(@TempDir Path directory)
            throws IOException {
        Path path = directory.resolve("property-field-metadata.json");
        Files.copy(contractPath(), path);

        PropertyMetadata metadata = PropertyMetadata.load(path, objectMapper);
        Files.writeString(path, "{}");

        assertThat(metadata.fields()).hasSize(7);
        assertThat(metadata.fields().get("bathrooms").min())
                .isEqualByComparingTo("0");
        assertThat(metadata.fields().get("bathrooms").max())
                .isEqualByComparingTo("100");
    }

    @Test
    void rejectsMissingOrInvalidMetadataAndIgnoresExtraFields(
            @TempDir Path directory)
            throws IOException {
        assertThatThrownBy(() -> PropertyMetadata.load(
                        directory.resolve("missing.json"), objectMapper))
                .isInstanceOf(PropertyMetadataException.class);

        var root = objectMapper.readTree(contractPath().toFile());
        ((com.fasterxml.jackson.databind.node.ObjectNode)
                        root.get("bathrooms"))
                .put("min", 101);
        Path invalid = directory.resolve("invalid.json");
        objectMapper.writeValue(invalid.toFile(), root);

        assertThatThrownBy(() -> PropertyMetadata.load(invalid, objectMapper))
                .isInstanceOf(PropertyMetadataException.class);

        var coercible = objectMapper.readTree(contractPath().toFile());
        ((com.fasterxml.jackson.databind.node.ObjectNode)
                        coercible.get("bathrooms"))
                .put("min", "0");
        objectMapper.writeValue(invalid.toFile(), coercible);
        assertThatThrownBy(() -> PropertyMetadata.load(invalid, objectMapper))
                .isInstanceOf(PropertyMetadataException.class);

        var extraField = objectMapper.readTree(contractPath().toFile());
        ((com.fasterxml.jackson.databind.node.ObjectNode)
                        extraField.get("bedrooms"))
                .put("unexpected", 1);
        ((com.fasterxml.jackson.databind.node.ObjectNode) extraField)
                .put("unexpected", true);
        objectMapper.writeValue(invalid.toFile(), extraField);
        assertThat(PropertyMetadata.load(invalid, objectMapper).fields())
                .hasSize(7);
    }

    @Test
    void validatorUsesSharedRange() {
        var metadata = PropertyMetadata.load(contractPath(), objectMapper);

        metadata.validate(RECORDS.getFirst().features());
        assertThatThrownBy(() -> metadata.validate(
                        new com.housinginsights.market.domain.PropertyFeatures(
                                1000,
                                2,
                                101,
                                1985,
                                5000,
                                2,
                                7)))
                .isInstanceOf(
                        com.housinginsights.market.error.InvalidRequestException
                                .class)
                .hasMessageContaining("range");
    }

    private static Path contractPath() {
        return Path.of(
                "..", "contracts", "property-field-metadata.json");
    }
}
