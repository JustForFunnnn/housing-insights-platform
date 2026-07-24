package com.housinginsights.market.support.observability;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class RequestCorrelationTest {

    @Test
    void acceptsSupportedUuid4FormsAndRejectsWrongVersionOrVariant() {
        assertThat(RequestCorrelation.isUuid4(
                "123E4567-E89B-42D3-A456-426614174000"
        )).isTrue();
        assertThat(RequestCorrelation.isUuid4(
                "123e4567e89b42d3a456426614174000"
        )).isTrue();

        assertThat(RequestCorrelation.isUuid4(
                "123e4567-e89b-32d3-a456-426614174000"
        )).isFalse();
        assertThat(RequestCorrelation.isUuid4(
                "123e4567-e89b-42d3-7456-426614174000"
        )).isFalse();
        assertThat(RequestCorrelation.isUuid4("not-a-uuid")).isFalse();
    }
}
