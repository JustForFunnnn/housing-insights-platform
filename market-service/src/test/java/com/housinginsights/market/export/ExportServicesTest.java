package com.housinginsights.market.export;

import static com.housinginsights.market.TestProperties.PROPERTIES;
import static org.assertj.core.api.Assertions.assertThat;

import java.io.StringReader;
import java.nio.charset.StandardCharsets;
import java.util.List;
import org.apache.commons.csv.CSVFormat;
import org.junit.jupiter.api.Test;

class ExportServicesTest {
    @Test
    void csvContainsAllProvidedRecordsInOrder() throws Exception {
        byte[] bytes = new CsvExportService().export(List.of(PROPERTIES.get(3), PROPERTIES.get(1)));

        try (var parser = CSVFormat.DEFAULT
                .builder()
                .setHeader()
                .setSkipHeaderRecord(true)
                .get()
                .parse(new StringReader(new String(bytes, StandardCharsets.UTF_8)))) {
            assertThat(parser.getRecords())
                    .extracting(record -> record.get("id"))
                    .containsExactly("4", "2");
        }
    }
}
