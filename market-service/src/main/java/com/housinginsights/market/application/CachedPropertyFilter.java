package com.housinginsights.market.application;

import com.housinginsights.market.data.PropertyDataset;
import com.housinginsights.market.domain.MarketFilter;
import com.housinginsights.market.domain.PropertyRecord;
import java.util.List;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

@Service
public class CachedPropertyFilter {
    private final PropertyDataset dataset;

    public CachedPropertyFilter(PropertyDataset dataset) {
        this.dataset = dataset;
    }

    @Cacheable(cacheNames = "filteredProperties", key = "#filter", sync = true)
    public List<PropertyRecord> filter(MarketFilter filter) {
        return dataset.properties().stream().filter(filter::matches).toList();
    }
}
