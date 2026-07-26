package com.housinginsights.market.api;

import com.housinginsights.market.api.schema.MarketFilterRequest;
import com.housinginsights.market.api.schema.MarketSortRequest;
import com.housinginsights.market.application.PropertyQueryService;
import com.housinginsights.market.export.CsvExportService;
import com.housinginsights.market.metadata.PropertyMetadata;
import jakarta.validation.Valid;
import java.nio.charset.StandardCharsets;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;

@MarketApiController
public class ExportController {
    private static final MediaType CSV_MEDIA_TYPE = MediaType.parseMediaType("text/csv;charset=UTF-8");

    private final PropertyQueryService propertyQueryService;
    private final CsvExportService csvExportService;
    private final PropertyMetadata propertyMetadata;

    public ExportController(
            PropertyQueryService propertyQueryService,
            CsvExportService csvExportService,
            PropertyMetadata propertyMetadata) {
        this.propertyQueryService = propertyQueryService;
        this.csvExportService = csvExportService;
        this.propertyMetadata = propertyMetadata;
    }

    @GetMapping(value = "/properties/export/csv", produces = "text/csv;charset=UTF-8")
    public ResponseEntity<byte[]> csv(
            @Valid @ParameterObject @ModelAttribute MarketFilterRequest filters,
            @ParameterObject @ModelAttribute MarketSortRequest sort) {
        byte[] body = csvExportService.export(propertyQueryService.findAll(
                filters.toFilter(propertyMetadata), sort.toSortField(), sort.toSortDirection()));
        return download(body, CSV_MEDIA_TYPE, "market-properties.csv");
    }

    private static ResponseEntity<byte[]> download(byte[] body, MediaType contentType, String filename) {
        ContentDisposition disposition = ContentDisposition.attachment()
                .filename(filename, StandardCharsets.UTF_8)
                .build();
        return ResponseEntity.ok()
                .contentType(contentType)
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .body(body);
    }
}
