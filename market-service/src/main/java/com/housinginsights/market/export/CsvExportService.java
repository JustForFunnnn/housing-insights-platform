package com.housinginsights.market.export;

import com.housinginsights.market.domain.PropertyRecord;
import java.io.IOException;
import java.io.StringWriter;
import java.nio.charset.StandardCharsets;
import java.util.List;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.springframework.stereotype.Service;

@Service
public class CsvExportService {
    private static final CSVFormat EXPORT_FORMAT = CSVFormat.DEFAULT.builder()
            .setHeader(
                    "id",
                    "square_footage",
                    "bedrooms",
                    "bathrooms",
                    "year_built",
                    "lot_size",
                    "distance_to_city_center",
                    "school_rating",
                    "price"
            )
            .get();

    public byte[] export(List<PropertyRecord> properties) {
        try (var writer = new StringWriter();
             var printer = new CSVPrinter(writer, EXPORT_FORMAT)) {
            for (PropertyRecord property : properties) {
                printer.printRecord(
                        property.id(),
                        property.squareFootage(),
                        property.bedrooms(),
                        property.bathrooms(),
                        property.yearBuilt(),
                        property.lotSize(),
                        property.distanceToCityCenter(),
                        property.schoolRating(),
                        property.price()
                );
            }
            printer.flush();
            return writer.toString().getBytes(StandardCharsets.UTF_8);
        } catch (IOException exception) {
            throw new ExportGenerationException("CSV export failed", exception);
        }
    }
}
