package com.housinginsights.market.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.housinginsights.market.data.CsvPropertyDataLoader;
import com.housinginsights.market.data.PropertyDataset;
import com.housinginsights.market.metadata.PropertyMetadata;
import com.housinginsights.market.observability.RequestCorrelation;
import io.swagger.v3.core.jackson.ModelResolver;
import io.swagger.v3.oas.models.media.StringSchema;
import io.swagger.v3.oas.models.parameters.Parameter;
import java.net.http.HttpClient;
import org.springdoc.core.customizers.OpenApiCustomizer;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

@Configuration
@EnableConfigurationProperties(MarketProperties.class)
public class MarketConfiguration {

    @Bean
    ModelResolver snakeCaseOpenApiModelResolver(ObjectMapper objectMapper) {
        return new ModelResolver(objectMapper.copy());
    }

    @Bean
    OpenApiCustomizer marketContractOpenApiCustomizer() {
        return openApi -> openApi.getPaths().values().stream()
                .flatMap(path -> path.readOperations().stream())
                .forEach(operation -> {
                    if (operation.getParameters() != null) {
                        operation.getParameters().stream()
                                .filter(parameter -> "query".equals(parameter.getIn()))
                                .forEach(
                                        parameter -> parameter.setName(PropertyNamingStrategies.SNAKE_CASE.nameForField(
                                                null, null, parameter.getName())));
                    }
                    operation.addParametersItem(new Parameter()
                            .in("header")
                            .name(RequestCorrelation.HEADER_NAME)
                            .required(false)
                            .description("Optional UUID4 in hyphenated or 32-character hex form. "
                                    + "Valid values are preserved exactly; missing or invalid values "
                                    + "are replaced with a compact UUID4.")
                            .schema(new StringSchema()));
                });
    }

    @Bean
    PropertyDataset propertyDataset(MarketProperties properties, CsvPropertyDataLoader loader) {
        return loader.load(properties.datasetPath());
    }

    @Bean
    PropertyMetadata propertyMetadata(
            MarketProperties properties, ObjectMapper objectMapper) {
        return PropertyMetadata.load(
                properties.propertyMetadataPath(), objectMapper);
    }

    @Bean
    RestClient predictionRestClient(MarketProperties properties, RestClient.Builder builder) {
        var timeout = properties.prediction().timeout();
        var httpClient = HttpClient.newBuilder()
                .connectTimeout(timeout)
                .version(HttpClient.Version.HTTP_1_1)
                .build();
        var requestFactory = new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(timeout);

        return builder.baseUrl(properties.prediction().baseUrl().toString())
                .requestFactory(requestFactory)
                .requestInterceptor((request, body, execution) -> {
                    request.getHeaders().set(RequestCorrelation.HEADER_NAME, RequestCorrelation.currentOrCreate());
                    return execution.execute(request, body);
                })
                .build();
    }
}
