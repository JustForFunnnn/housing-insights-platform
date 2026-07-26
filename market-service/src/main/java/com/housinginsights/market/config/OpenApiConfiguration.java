package com.housinginsights.market.config;

import com.housinginsights.market.api.ExportController;
import com.housinginsights.market.api.MarketController;
import com.housinginsights.market.api.WhatIfController;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.headers.Header;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.media.Content;
import io.swagger.v3.oas.models.media.ObjectSchema;
import io.swagger.v3.oas.models.media.Schema;
import io.swagger.v3.oas.models.media.StringSchema;
import io.swagger.v3.oas.models.responses.ApiResponse;
import java.util.Map;
import org.springdoc.core.customizers.OperationCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfiguration {
    private static final String JSON = "application/json";
    private static final String REQUEST_ID_HEADER = "X-Request-ID";
    private static final String ERROR_SCHEMA = "#/components/schemas/ApiErrorResponse";

    @Bean
    public OpenAPI marketOpenApi() {
        return new OpenAPI()
                .components(new Components().addSchemas("ApiErrorResponse", apiErrorSchema()))
                .info(new Info()
                        .title("Housing Insights Market Service")
                        .version("0.1.0")
                        .description("Read-only housing market analysis and what-if API."));
    }

    @Bean
    public OperationCustomizer marketOperationContracts() {
        return (operation, handlerMethod) -> {
            Class<?> controller = handlerMethod.getBeanType();
            normalizeSuccessContent(operation.getResponses(), controller);
            operation
                    .getResponses()
                    .values()
                    .forEach(response -> response.addHeaderObject(REQUEST_ID_HEADER, requestIdHeader()));
            operation.getResponses().putIfAbsent("500", errorResponse("The request could not be completed."));

            if (controller == MarketController.class
                    || controller == WhatIfController.class
                    || controller == ExportController.class) {
                operation.getResponses().putIfAbsent("422", errorResponse("Request validation failed."));
            }
            if (controller == WhatIfController.class) {
                operation
                        .getResponses()
                        .putIfAbsent("502", errorResponse("The prediction service returned an invalid response."));
                operation
                        .getResponses()
                        .putIfAbsent("503", errorResponse("Price estimation is temporarily unavailable."));
            }
            return operation;
        };
    }

    private static void normalizeSuccessContent(Map<String, ApiResponse> responses, Class<?> controller) {
        if (controller == ExportController.class) {
            return;
        }
        ApiResponse success = responses.get("200");
        if (success == null || success.getContent() == null) {
            return;
        }
        io.swagger.v3.oas.models.media.MediaType wildcard = success.getContent().remove("*/*");
        if (wildcard != null) {
            success.setContent(new Content().addMediaType(JSON, wildcard));
        }
    }

    private static Header requestIdHeader() {
        return new Header()
                .description("The active request correlation identifier.")
                .schema(new StringSchema());
    }

    private static ApiResponse errorResponse(String description) {
        Schema<?> schema = new Schema<>().$ref(ERROR_SCHEMA);
        return new ApiResponse()
                .description(description)
                .content(
                        new Content().addMediaType(JSON, new io.swagger.v3.oas.models.media.MediaType().schema(schema)))
                .addHeaderObject(REQUEST_ID_HEADER, requestIdHeader());
    }

    private static Schema<?> apiErrorSchema() {
        return new ObjectSchema()
                .addProperty("error_code", new StringSchema())
                .addProperty("message", new StringSchema());
    }
}
