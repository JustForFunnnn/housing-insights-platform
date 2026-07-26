package com.housinginsights.market.data;

import com.housinginsights.market.domain.PropertyFieldNames;
import com.housinginsights.market.domain.PropertyRecord;
import com.housinginsights.market.error.DatasetLoadingException;
import com.housinginsights.market.metadata.PropertyMetadata;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.apache.commons.csv.DuplicateHeaderMode;
import org.apache.commons.io.input.BOMInputStream;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class CsvPropertyDataLoader {
    private static final Logger logger = LoggerFactory.getLogger(CsvPropertyDataLoader.class);

    private static final List<String> REQUIRED_COLUMNS =
            PropertyFieldNames.CSV_COLUMNS;

    private static final CSVFormat CSV_FORMAT = CSVFormat.DEFAULT
            .builder()
            .setHeader()
            .setSkipHeaderRecord(true)
            .setIgnoreEmptyLines(false)
            .setTrim(true)
            .setDuplicateHeaderMode(DuplicateHeaderMode.DISALLOW)
            .get();

    private final PropertyMetadata propertyMetadata;

    public CsvPropertyDataLoader(PropertyMetadata propertyMetadata) {
        this.propertyMetadata = propertyMetadata;
    }

    public PropertyDataset load(Path path) {
        if (path == null || !Files.isRegularFile(path) || !Files.isReadable(path)) {
            throw new DatasetLoadingException("market dataset is missing or unreadable");
        }

        try (Reader reader = new InputStreamReader(
                        BOMInputStream.builder().setPath(path).get(), StandardCharsets.UTF_8);
                CSVParser parser = CSV_FORMAT.parse(reader)) {
            validateHeaders(parser);
            var properties = parseRecords(parser);
            var dataset = new PropertyDataset(properties);
            logger.info(
                    "dataset_loaded records={} path={}", dataset.properties().size(), path);
            return dataset;
        } catch (DatasetLoadingException exception) {
            throw exception;
        } catch (IOException | RuntimeException exception) {
            throw new DatasetLoadingException("market dataset could not be read", exception);
        }
    }

    private static void validateHeaders(CSVParser parser) {
        Set<String> headers = parser.getHeaderMap().keySet();
        List<String> missing = REQUIRED_COLUMNS.stream()
                .filter(column -> !headers.contains(column))
                .toList();
        if (!missing.isEmpty()) {
            throw new DatasetLoadingException(
                    "market dataset is missing required columns: " + String.join(", ", missing));
        }
    }

    private List<PropertyRecord> parseRecords(CSVParser parser) throws IOException {
        List<PropertyRecord> properties = new ArrayList<>();
        Set<Long> identifiers = new HashSet<>();

        for (CSVRecord row : parser) {
            long lineNumber = row.getRecordNumber() + 1;
            if (!row.isConsistent()) {
                throw new DatasetLoadingException(
                        "CSV row " + lineNumber + " has an unexpected number of columns");
            }
            PropertyRecord property = parseRecord(row, lineNumber);
            if (!identifiers.add(property.id())) {
                throw rowError(lineNumber, PropertyFieldNames.ID, "must be unique");
            }
            properties.add(property);
        }
        return properties;
    }

    private PropertyRecord parseRecord(CSVRecord row, long lineNumber) {
        long id = parseLong(row, lineNumber, PropertyFieldNames.ID);
        double squareFootage = parseDouble(row, lineNumber, PropertyFieldNames.SQUARE_FOOTAGE);
        int bedrooms = parseInteger(row, lineNumber, PropertyFieldNames.BEDROOMS);
        double bathrooms = parseDouble(row, lineNumber, PropertyFieldNames.BATHROOMS);
        int yearBuilt = parseInteger(row, lineNumber, PropertyFieldNames.YEAR_BUILT);
        double lotSize = parseDouble(row, lineNumber, PropertyFieldNames.LOT_SIZE);
        double distance = parseDouble(row, lineNumber, PropertyFieldNames.DISTANCE_TO_CITY_CENTER);
        double schoolRating = parseDouble(row, lineNumber, PropertyFieldNames.SCHOOL_RATING);
        long price = parseLong(row, lineNumber, PropertyFieldNames.PRICE);

        require(id > 0, lineNumber, PropertyFieldNames.ID, "must be positive");
        require(price > 0, lineNumber, PropertyFieldNames.PRICE, "must be positive");

        var property = new PropertyRecord(
                id, squareFootage, bedrooms, bathrooms, yearBuilt, lotSize, distance, schoolRating, price);
        try {
            propertyMetadata.validate(property.features());
        } catch (RuntimeException exception) {
            throw new DatasetLoadingException(
                    "CSV row "
                            + lineNumber
                            + " contains invalid property features: "
                            + exception.getMessage(),
                    exception);
        }
        return property;
    }

    private static long parseLong(CSVRecord row, long lineNumber, String column) {
        String value = value(row, lineNumber, column);
        try {
            return Long.parseLong(value);
        } catch (NumberFormatException exception) {
            throw rowError(lineNumber, column, "must be an integer", exception);
        }
    }

    private static int parseInteger(CSVRecord row, long lineNumber, String column) {
        String value = value(row, lineNumber, column);
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException exception) {
            throw rowError(lineNumber, column, "must be an integer", exception);
        }
    }

    private static double parseDouble(CSVRecord row, long lineNumber, String column) {
        String value = value(row, lineNumber, column);
        try {
            double number = Double.parseDouble(value);
            if (!Double.isFinite(number)) {
                throw rowError(lineNumber, column, "must be finite");
            }
            return number;
        } catch (NumberFormatException exception) {
            throw rowError(lineNumber, column, "must be numeric", exception);
        }
    }

    private static String value(CSVRecord row, long lineNumber, String column) {
        try {
            String value = row.get(column);
            if (value == null || value.isBlank()) {
                throw rowError(lineNumber, column, "must not be blank");
            }
            return value;
        } catch (IllegalArgumentException exception) {
            throw rowError(lineNumber, column, "is missing", exception);
        }
    }

    private static void require(boolean condition, long lineNumber, String column, String message) {
        if (!condition) {
            throw rowError(lineNumber, column, message);
        }
    }

    private static DatasetLoadingException rowError(long lineNumber, String column, String message) {
        return new DatasetLoadingException("CSV row " + lineNumber + " column '" + column + "' " + message);
    }

    private static DatasetLoadingException rowError(long lineNumber, String column, String message, Throwable cause) {
        return new DatasetLoadingException("CSV row " + lineNumber + " column '" + column + "' " + message, cause);
    }
}
