package com.housinginsights.market.application;

import static com.housinginsights.market.TestProperties.PROPERTIES;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.github.benmanes.caffeine.cache.Caffeine;
import com.housinginsights.market.data.PropertyDataset;
import com.housinginsights.market.domain.MarketFilter;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.Test;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

class CachedPropertyFilterTest {
    @Test
    void identicalCanonicalFilterReusesImmutableFullResult() {
        try (var context = new AnnotationConfigApplicationContext(TestConfiguration.class)) {
            CachedPropertyFilter cachedFilter = context.getBean(CachedPropertyFilter.class);

            var first = cachedFilter.filter(MarketFilter.empty());
            var second = cachedFilter.filter(MarketFilter.empty());

            assertThat(second).isSameAs(first);
            assertThat(first).containsExactlyElementsOf(PROPERTIES);
            assertThatThrownBy(() -> first.add(PROPERTIES.getFirst()))
                    .isInstanceOf(UnsupportedOperationException.class);
        }
    }

    @Configuration
    @EnableCaching
    static class TestConfiguration {
        @Bean
        PropertyDataset dataset() {
            return new PropertyDataset(PROPERTIES);
        }

        @Bean
        CachedPropertyFilter cachedPropertyFilter(PropertyDataset dataset) {
            return new CachedPropertyFilter(dataset);
        }

        @Bean
        CacheManager cacheManager() {
            CaffeineCacheManager manager = new CaffeineCacheManager("filteredProperties");
            manager.setCaffeine(Caffeine.newBuilder().maximumSize(10).expireAfterAccess(1, TimeUnit.MINUTES));
            return manager;
        }
    }
}
