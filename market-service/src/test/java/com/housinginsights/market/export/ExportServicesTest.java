package com.housinginsights.market.export;

import static com.housinginsights.market.TestProperties.RECORDS;
import static org.assertj.core.api.Assertions.assertThat;

import com.housinginsights.market.data.PropertyDataset;
import com.housinginsights.market.domain.MarketAnalysis;
import com.housinginsights.market.domain.MarketAnalysisCalculator;
import com.housinginsights.market.domain.MarketFilter;
import com.housinginsights.market.domain.PropertyQueryService;
import java.io.ByteArrayInputStream;
import java.io.StringReader;
import java.nio.charset.StandardCharsets;
import java.util.List;
import org.apache.commons.csv.CSVFormat;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.graphics.PDXObject;
import org.apache.pdfbox.text.PDFTextStripper;
import org.junit.jupiter.api.Test;

class ExportServicesTest {
    @Test
    void csvContainsAllProvidedRecordsInOrder() throws Exception {
        byte[] bytes = new CsvExportService().export(
                List.of(RECORDS.get(3), RECORDS.get(1))
        );

        try (var parser = CSVFormat.DEFAULT.builder()
                .setHeader()
                .setSkipHeaderRecord(true)
                .get()
                .parse(new StringReader(
                        new String(bytes, StandardCharsets.UTF_8)
                ))) {
            assertThat(parser.getRecords())
                    .extracting(record -> record.get("id"))
                    .containsExactly("4", "2");
        }
    }

    @Test
    void pdfContainsSummaryAndFourRenderedCharts() throws Exception {
        PropertyDataset dataset = new PropertyDataset(RECORDS);
        MarketAnalysis analysis = new MarketAnalysisCalculator(
                new PropertyQueryService(dataset),
                dataset
        ).calculate(MarketFilter.empty());
        byte[] bytes = new PdfExportService(new MarketChartRenderer())
                .export(MarketFilter.empty(), analysis);

        try (PDDocument document = Loader.loadPDF(bytes)) {
            assertThat(document.getNumberOfPages()).isEqualTo(5);
            assertThat(new PDFTextStripper().getText(document))
                    .contains("Property Market Analysis")
                    .contains("Matching properties: 4");
            int images = 0;
            for (var page : document.getPages()) {
                for (var name : page.getResources().getXObjectNames()) {
                    PDXObject object = page.getResources().getXObject(name);
                    if (object instanceof org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject) {
                        images++;
                    }
                }
            }
            assertThat(images).isEqualTo(4);
        }
    }
}
