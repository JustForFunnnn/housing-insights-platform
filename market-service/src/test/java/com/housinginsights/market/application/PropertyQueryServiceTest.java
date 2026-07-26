package com.housinginsights.market.application;

import static com.housinginsights.market.TestProperties.RECORDS;
import static org.assertj.core.api.Assertions.assertThat;

import com.housinginsights.market.data.PropertyDataset;
import com.housinginsights.market.domain.MarketFilter;
import com.housinginsights.market.domain.PropertyPage;
import com.housinginsights.market.domain.PropertyRecord;
import com.housinginsights.market.domain.SortDirection;
import com.housinginsights.market.domain.SortField;
import java.util.Collections;
import java.util.TreeSet;
import org.junit.jupiter.api.Test;

class PropertyQueryServiceTest {
    private final PropertyQueryService service =
            new PropertyQueryService(new CachedPropertyFilter(new PropertyDataset(RECORDS)));

    @Test
    void filtersSortsAndLimitsWithStableOrder() {
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
                null);

        PropertyPage page = service.findPage(filter, SortField.PRICE, SortDirection.DESC, 1, 0);

        assertThat(page.records()).extracting(PropertyRecord::id).containsExactly(3L);
        assertThat(page.total()).isEqualTo(2);
        assertThat(page.limit()).isEqualTo(1);
        assertThat(page.offset()).isZero();
    }

    @Test
    void offsetPastTotalIsEmptyAndKeepsPaginationMetadata() {
        PropertyPage page = service.findPage(MarketFilter.empty(), SortField.ID, SortDirection.ASC, 2, 20);

        assertThat(page.records()).isEmpty();
        assertThat(page.total()).isEqualTo(4);
        assertThat(page.limit()).isEqualTo(2);
        assertThat(page.offset()).isEqualTo(20);
    }
}
