package com.housinginsights.market.domain;

import static com.housinginsights.market.TestProperties.RECORDS;
import static org.assertj.core.api.Assertions.assertThat;

import com.housinginsights.market.data.PropertyDataset;
import java.util.Collections;
import java.util.TreeSet;
import org.junit.jupiter.api.Test;

class PropertyQueryServiceTest {
    private final PropertyQueryService service =
            new PropertyQueryService(new PropertyDataset(RECORDS));

    @Test
    void filtersSortsAndPagesWithStableOrder() {
        MarketFilter filter = new MarketFilter(
                null,
                null,
                new TreeSet<>(Collections.singleton(3)),
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null
        );

        PropertyPage page = service.findPage(
                filter,
                SortField.PRICE,
                SortDirection.DESC,
                0,
                1
        );

        assertThat(page.records()).extracting(PropertyRecord::id).containsExactly(3L);
        assertThat(page.total()).isEqualTo(2);
        assertThat(page.totalPages()).isEqualTo(2);
    }

    @Test
    void pagePastTotalIsEmptyAndKeepsTotals() {
        PropertyPage page = service.findPage(
                MarketFilter.empty(),
                SortField.ID,
                SortDirection.ASC,
                20,
                2
        );

        assertThat(page.records()).isEmpty();
        assertThat(page.total()).isEqualTo(4);
        assertThat(page.totalPages()).isEqualTo(2);
    }
}
