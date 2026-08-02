package com.housinginsights.market.application;

import com.housinginsights.market.domain.MarketFilter;
import com.housinginsights.market.domain.Property;
import com.housinginsights.market.domain.PropertyPage;
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

    public List<Property> findAll(MarketFilter filter) {
        return cachedPropertyFilter.filter(filter);
    }

    public List<Property> findAll(MarketFilter filter, SortField sortField, SortDirection direction) {
        return findAll(filter).stream().sorted(comparator(sortField, direction)).toList();
    }

    public PropertyPage findPage(
            MarketFilter filter, SortField sortField, SortDirection direction, int limit, int offset) {
        List<Property> matched = findAll(filter, sortField, direction);
        long total = matched.size();
        List<Property> properties = offset >= total
                ? List.of()
                : matched.subList(offset, Math.toIntExact(Math.min((long) offset + limit, total)));
        return new PropertyPage(properties, total, limit, offset, sortField, direction);
    }

    private static Comparator<Property> comparator(SortField sortField, SortDirection direction) {
        Comparator<Property> primary = sortField.comparator();
        if (direction == SortDirection.DESC) {
            primary = primary.reversed();
        }
        return primary.thenComparingLong(Property::id);
    }
}
