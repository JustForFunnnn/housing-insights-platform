package com.housinginsights.market.domain;

import com.housinginsights.market.data.PropertyDataset;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class PropertyQueryService {
    private final PropertyDataset dataset;

    public PropertyQueryService(PropertyDataset dataset) {
        this.dataset = dataset;
    }

    public List<PropertyRecord> filter(MarketFilter filter) {
        return dataset.properties().stream()
                .filter(filter::matches)
                .toList();
    }

    public List<PropertyRecord> findAll(
            MarketFilter filter,
            SortField sortField,
            SortDirection direction
    ) {
        return dataset.properties().stream()
                .filter(filter::matches)
                .sorted(comparator(sortField, direction))
                .toList();
    }

    public PropertyPage findPage(
            MarketFilter filter,
            SortField sortField,
            SortDirection direction,
            int limit,
            int offset
    ) {
        List<PropertyRecord> matched = findAll(filter, sortField, direction);
        long total = matched.size();
        List<PropertyRecord> records = offset >= total
                ? List.of()
                : matched.subList(
                        offset,
                        Math.toIntExact(Math.min((long) offset + limit, total))
                );
        return new PropertyPage(
                records,
                records.size(),
                total,
                limit,
                offset,
                sortField,
                direction
        );
    }

    private static Comparator<PropertyRecord> comparator(
            SortField sortField,
            SortDirection direction
    ) {
        Comparator<PropertyRecord> primary = sortField.comparator();
        if (direction == SortDirection.DESC) {
            primary = primary.reversed();
        }
        return primary.thenComparingLong(PropertyRecord::id);
    }
}
