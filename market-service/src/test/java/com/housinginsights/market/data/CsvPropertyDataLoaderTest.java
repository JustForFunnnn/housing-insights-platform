package com.housinginsights.market.data;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.housinginsights.market.error.DatasetLoadingException;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class CsvPropertyDataLoaderTest {
    private static final String HEADER = """
            id,square_footage,bedrooms,bathrooms,year_built,lot_size,distance_to_city_center,school_rating,price
            """;

    private final CsvPropertyDataLoader loader = new CsvPropertyDataLoader();

    @Test
    void loadsValidDataset(@TempDir Path directory) throws IOException {
        Path dataset = write(directory, "\uFEFF" + HEADER
                + "1,1200,2,1,1990,5000,2.5,7.0,180000\n"
                + "2,1800,3,2,2000,7500,5.0,8.0,280000\n");

        PropertyDataset loaded = loader.load(dataset);

        assertThat(loaded.properties()).hasSize(2);
        assertThat(loaded.properties().getFirst().price()).isEqualTo(180000);
    }

    @Test
    void rejectsMissingFileAndRequiredColumn(@TempDir Path directory)
            throws IOException {
        assertThatThrownBy(() -> loader.load(directory.resolve("missing.csv")))
                .isInstanceOf(DatasetLoadingException.class)
                .hasMessageContaining("missing or unreadable");

        Path dataset = write(
                directory,
                HEADER.replace(",school_rating", "")
                        + "1,1200,2,1,1990,5000,2.5,180000\n"
        );
        assertThatThrownBy(() -> loader.load(dataset))
                .isInstanceOf(DatasetLoadingException.class)
                .hasMessageContaining("school_rating");
    }

    @Test
    void rejectsDuplicateIdentifier(@TempDir Path directory) throws IOException {
        Path dataset = write(directory, HEADER
                + "1,1200,2,1,1990,5000,2.5,7.0,180000\n"
                + "1,1800,3,2,2000,7500,5.0,8.0,280000\n");

        assertThatThrownBy(() -> loader.load(dataset))
                .isInstanceOf(DatasetLoadingException.class)
                .hasMessageContaining("must be unique");
    }

    @Test
    void rejectsMalformedAndInvalidRows(@TempDir Path directory)
            throws IOException {
        Path malformed = write(directory, HEADER
                + "1,not-a-number,2,1,1990,5000,2.5,7.0,180000\n");
        assertThatThrownBy(() -> loader.load(malformed))
                .isInstanceOf(DatasetLoadingException.class)
                .hasMessageContaining("square_footage");

        Path invalid = write(directory, HEADER
                + "1,1200,2,1,1990,5000,2.5,11,180000\n");
        assertThatThrownBy(() -> loader.load(invalid))
                .isInstanceOf(DatasetLoadingException.class)
                .hasMessageContaining("school_rating");
    }

    private static Path write(Path directory, String content) throws IOException {
        Path dataset = directory.resolve("market.csv");
        Files.writeString(dataset, content);
        return dataset;
    }
}
