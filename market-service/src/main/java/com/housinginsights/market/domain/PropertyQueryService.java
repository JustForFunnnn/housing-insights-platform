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
            int page,
            int size
    ) {
        List<PropertyRecord> matched = findAll(filter, sortField, direction);
        long total = matched.size();
        int totalPages = total == 0
                ? 0
                : Math.toIntExact((total + size - 1) / size);
        long first = (long) page * size;
        List<PropertyRecord> records = first >= total
                ? List.of()
                : matched.subList(
                        Math.toIntExact(first),
                        (int) Math.min(first + size, total)
                );
        return new PropertyPage(
                records,
                records.size(),
                total,
                page,
                size,
                totalPages,
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
