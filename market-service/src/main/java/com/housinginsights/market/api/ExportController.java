package com.housinginsights.market.api;

import com.housinginsights.market.application.MarketAnalysisService;
import com.housinginsights.market.application.PropertyQueryService;
import com.housinginsights.market.api.schema.MarketFilterRequest;
import com.housinginsights.market.domain.MarketAnalysis;
import com.housinginsights.market.domain.MarketFilter;
import com.housinginsights.market.domain.SortDirection;
import com.housinginsights.market.domain.SortField;
import com.housinginsights.market.export.CsvExportService;
import com.housinginsights.market.export.PdfExportService;
import jakarta.validation.Valid;
import java.nio.charset.StandardCharsets;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ExportController {
    private static final MediaType CSV_MEDIA_TYPE =
            MediaType.parseMediaType("text/csv;charset=UTF-8");

    private final PropertyQueryService propertyQueryService;
    private final MarketAnalysisService analysisService;
    private final CsvExportService csvExportService;
    private final PdfExportService pdfExportService;

    public ExportController(
            PropertyQueryService propertyQueryService,
            MarketAnalysisService analysisService,
            CsvExportService csvExportService,
            PdfExportService pdfExportService
    ) {
        this.propertyQueryService = propertyQueryService;
        this.analysisService = analysisService;
        this.csvExportService = csvExportService;
        this.pdfExportService = pdfExportService;
    }

    @GetMapping(
            value = "/exports/properties.csv",
            produces = "text/csv;charset=UTF-8"
    )
    public ResponseEntity<byte[]> csv(
            @Valid @ParameterObject @ModelAttribute
            MarketFilterRequest filters,
            @RequestParam(
                    name = MarketQueryParameters.SORT_BY,
                    defaultValue = MarketQueryParameters.DEFAULT_SORT_BY
            )
            String sortBy,
            @RequestParam(
                    name = MarketQueryParameters.SORT_DIRECTION,
                    defaultValue = MarketQueryParameters.DEFAULT_SORT_DIRECTION
            )
            String sortDirection
    ) {
        byte[] body = csvExportService.export(propertyQueryService.findAll(
                filters.toFilter(),
                SortField.parse(sortBy),
                SortDirection.parse(sortDirection)
        ));
        return download(body, CSV_MEDIA_TYPE, "market-properties.csv");
    }

    @GetMapping(
            value = "/exports/market-analysis.pdf",
            produces = MediaType.APPLICATION_PDF_VALUE
    )
    public ResponseEntity<byte[]> pdf(
            @Valid @ParameterObject @ModelAttribute
            MarketFilterRequest filters
    ) {
        MarketFilter filter = filters.toFilter();
        MarketAnalysis analysis = analysisService.analyse(filter);
        byte[] body = pdfExportService.export(filter, analysis);
        return download(body, MediaType.APPLICATION_PDF, "market-analysis.pdf");
    }

    private static ResponseEntity<byte[]> download(
            byte[] body,
            MediaType contentType,
            String filename
    ) {
        ContentDisposition disposition = ContentDisposition.attachment()
                .filename(filename, StandardCharsets.UTF_8)
                .build();
        return ResponseEntity.ok()
                .contentType(contentType)
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .body(body);
    }
}
