package com.housinginsights.market.application;

import com.housinginsights.market.domain.MarketFilter;
import com.housinginsights.market.domain.PropertyPage;
import com.housinginsights.market.domain.PropertyRecord;
import com.housinginsights.market.domain.SortDirection;
import com.housinginsights.market.domain.SortField;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class PropertyQueryService {
    private final CachedPropertyFilter cachedPropertyFilter;

    public PropertyQueryService(CachedPropertyFilter cachedPropertyFilter) {
        this.cachedPropertyFilter = cachedPropertyFilter;
    }

    public List<PropertyRecord> filter(MarketFilter filter) {
        return cachedPropertyFilter.filter(filter);
    }

    public List<PropertyRecord> findAll(MarketFilter filter, SortField sortField, SortDirection direction) {
        return filter(filter).stream().sorted(comparator(sortField, direction)).toList();
    }

    public PropertyPage findPage(
            MarketFilter filter, SortField sortField, SortDirection direction, int limit, int offset) {
        List<PropertyRecord> matched = findAll(filter, sortField, direction);
        long total = matched.size();
        List<PropertyRecord> records = offset >= total
                ? List.of()
                : matched.subList(offset, Math.toIntExact(Math.min((long) offset + limit, total)));
        return new PropertyPage(records, total, limit, offset, sortField, direction);
    }

    private static Comparator<PropertyRecord> comparator(SortField sortField, SortDirection direction) {
        Comparator<PropertyRecord> primary = sortField.comparator();
        if (direction == SortDirection.DESC) {
            primary = primary.reversed();
        }
        return primary.thenComparingLong(PropertyRecord::id);
    }
}
