package com.housinginsights.market.export;

import com.housinginsights.market.domain.MarketAnalysis;
import com.housinginsights.market.domain.MarketFilter;
import com.housinginsights.market.error.ExportGenerationException;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.springframework.stereotype.Service;

@Service
public class PdfExportService {
    private static final PDType1Font TITLE_FONT = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
    private static final PDType1Font BODY_FONT = new PDType1Font(Standard14Fonts.FontName.HELVETICA);

    private final MarketChartRenderer chartRenderer;

    public PdfExportService(MarketChartRenderer chartRenderer) {
        this.chartRenderer = chartRenderer;
    }

    public byte[] export(MarketFilter filter, MarketAnalysis analysis) {
        try (var document = new PDDocument();
                var output = new ByteArrayOutputStream()) {
            addSummaryPage(document, filter, analysis);
            for (MarketChartRenderer.RenderedChart chart : chartRenderer.render(analysis)) {
                addChartPage(document, chart);
            }
            document.save(output);
            return output.toByteArray();
        } catch (IOException exception) {
            throw new ExportGenerationException("PDF export failed", exception);
        }
    }

    private static void addSummaryPage(PDDocument document, MarketFilter filter, MarketAnalysis analysis)
            throws IOException {
        PDPage page = new PDPage(PDRectangle.A4);
        document.addPage(page);

        try (var content = new PDPageContentStream(document, page)) {
            float y = 790;
            y = line(content, TITLE_FONT, 20, 45, y, "Property Market Analysis");
            y -= 8;
            y = line(content, BODY_FONT, 11, 45, y, "Matching properties: " + analysis.count());
            y = line(content, TITLE_FONT, 13, 45, y, "Applied filters");
            for (String filterLine : describe(filter)) {
                y = line(content, BODY_FONT, 10, 55, y, filterLine);
            }
            y -= 8;
            y = line(content, TITLE_FONT, 13, 45, y, "Price summary");
            if (analysis.count() == 0) {
                line(content, BODY_FONT, 11, 55, y, "No matching properties.");
                return;
            }
            MarketAnalysis.PriceSummary summary = analysis.priceSummary();
            y = line(content, BODY_FONT, 11, 55, y, "Minimum: " + summary.minimum());
            y = line(content, BODY_FONT, 11, 55, y, "Maximum: " + summary.maximum());
            y = line(content, BODY_FONT, 11, 55, y, "Average: " + summary.average());
            line(content, BODY_FONT, 11, 55, y, "Median: " + summary.median());
        }
    }

    private static void addChartPage(PDDocument document, MarketChartRenderer.RenderedChart chart) throws IOException {
        PDPage page = new PDPage(PDRectangle.A4);
        document.addPage(page);
        PDImageXObject image = PDImageXObject.createFromByteArray(document, chart.png(), chart.title());
        try (var content = new PDPageContentStream(document, page)) {
            line(content, TITLE_FONT, 17, 45, 790, chart.title());
            content.drawImage(image, 45, 190, 505, 281);
        }
    }

    private static float line(
            PDPageContentStream content, PDType1Font font, float fontSize, float x, float y, String text)
            throws IOException {
        content.beginText();
        content.setFont(font, fontSize);
        content.newLineAtOffset(x, y);
        content.showText(text);
        content.endText();
        return y - fontSize - 6;
    }

    private static List<String> describe(MarketFilter filter) {
        List<String> values = new ArrayList<>();
        addRange(values, "Square footage", filter.minSquareFootage(), filter.maxSquareFootage());
        if (!filter.bedrooms().isEmpty()) {
            values.add("Bedrooms: " + filter.bedrooms());
        }
        if (!filter.bathrooms().isEmpty()) {
            values.add("Bathrooms: " + filter.bathrooms());
        }
        addRange(values, "Year built", filter.minYearBuilt(), filter.maxYearBuilt());
        addRange(values, "Lot size", filter.minLotSize(), filter.maxLotSize());
        addRange(values, "Distance to city center", filter.minDistanceToCityCenter(), filter.maxDistanceToCityCenter());
        addRange(values, "School rating", filter.minSchoolRating(), filter.maxSchoolRating());
        addRange(values, "Price", filter.minPrice(), filter.maxPrice());
        return values.isEmpty() ? List.of("All properties") : values;
    }

    private static void addRange(List<String> values, String label, Object minimum, Object maximum) {
        if (minimum != null || maximum != null) {
            values.add(
                    label + ": " + (minimum == null ? "any" : minimum) + " to " + (maximum == null ? "any" : maximum));
        }
    }
}
