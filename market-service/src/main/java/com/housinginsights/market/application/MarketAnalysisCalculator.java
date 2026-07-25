package com.housinginsights.market.application;

import com.housinginsights.market.data.PropertyDataset;
import com.housinginsights.market.domain.MarketAnalysis;
import com.housinginsights.market.domain.MarketAnalysis.BedroomPriceGroup;
import com.housinginsights.market.domain.MarketAnalysis.DoubleRange;
import com.housinginsights.market.domain.MarketAnalysis.FilterOptions;
import com.housinginsights.market.domain.MarketAnalysis.IntegerRange;
import com.housinginsights.market.domain.MarketAnalysis.LongRange;
import com.housinginsights.market.domain.MarketAnalysis.PriceDistributionBucket;
import com.housinginsights.market.domain.MarketAnalysis.PriceSummary;
import com.housinginsights.market.domain.MarketAnalysis.SquareFootagePriceGroup;
import com.housinginsights.market.domain.MarketAnalysis.Visualisations;
import com.housinginsights.market.domain.MarketAnalysis.YearDecadePriceGroup;
import com.housinginsights.market.domain.MarketFilter;
import com.housinginsights.market.domain.PropertyRecord;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.apache.commons.statistics.descriptive.Mean;
import org.apache.commons.statistics.descriptive.Median;
import org.springframework.stereotype.Component;

@Component
public class MarketAnalysisCalculator {
    static final long PRICE_BUCKET_WIDTH = 50_000;
    static final long SQUARE_FOOTAGE_BUCKET_WIDTH = 500;

    private final PropertyQueryService propertyQueryService;
    private final FilterOptions filterOptions;

    public MarketAnalysisCalculator(
            PropertyQueryService propertyQueryService,
            PropertyDataset dataset
    ) {
        this.propertyQueryService = propertyQueryService;
        this.filterOptions = filterOptions(dataset.properties());
    }

    public MarketAnalysis calculate(MarketFilter filter) {
        List<PropertyRecord> properties = propertyQueryService.filter(filter);
        if (properties.isEmpty()) {
            return new MarketAnalysis(
                    0,
                    new PriceSummary(null, null, null, null),
                    new Visualisations(List.of(), List.of(), List.of(), List.of()),
                    filterOptions
            );
        }

        return new MarketAnalysis(
                properties.size(),
                priceSummary(properties),
                new Visualisations(
                        priceDistribution(properties),
                        averagePriceByBedrooms(properties),
                        averagePriceByYearBuiltDecade(properties),
                        averagePriceBySquareFootageBand(properties)
                ),
                filterOptions
        );
    }

    private static PriceSummary priceSummary(List<PropertyRecord> properties) {
        double[] prices = prices(properties);
        long minimum = properties.stream()
                .mapToLong(PropertyRecord::price)
                .min()
                .orElseThrow();
        long maximum = properties.stream()
                .mapToLong(PropertyRecord::price)
                .max()
                .orElseThrow();
        return new PriceSummary(
                minimum,
                maximum,
                decimal(Mean.of(prices).getAsDouble()),
                decimal(Median.withDefaults().evaluate(prices))
        );
    }

    private static List<PriceDistributionBucket> priceDistribution(
            List<PropertyRecord> properties
    ) {
        Map<Long, Long> counts = properties.stream()
                .collect(Collectors.groupingBy(
                        property -> Math.floorDiv(
                                property.price(),
                                PRICE_BUCKET_WIDTH
                        ) * PRICE_BUCKET_WIDTH,
                        TreeMap::new,
                        Collectors.counting()
                ));
        return counts.entrySet().stream()
                .map(entry -> {
                    long lower = entry.getKey();
                    long upper = lower > Long.MAX_VALUE - PRICE_BUCKET_WIDTH
                            ? Long.MAX_VALUE
                            : lower + PRICE_BUCKET_WIDTH - 1;
                    return new PriceDistributionBucket(
                            lower + "-" + upper,
                            lower,
                            upper,
                            entry.getValue()
                    );
                })
                .toList();
    }

    private static List<BedroomPriceGroup> averagePriceByBedrooms(
            List<PropertyRecord> properties
    ) {
        return groupBy(properties, PropertyRecord::bedrooms).entrySet().stream()
                .map(entry -> new BedroomPriceGroup(
                        entry.getKey(),
                        averagePrice(entry.getValue()),
                        entry.getValue().size()
                ))
                .toList();
    }

    private static List<YearDecadePriceGroup> averagePriceByYearBuiltDecade(
            List<PropertyRecord> properties
    ) {
        return groupBy(
                properties,
                property -> Math.floorDiv(property.yearBuilt(), 10) * 10
        ).entrySet().stream()
                .map(entry -> {
                    int start = entry.getKey();
                    return new YearDecadePriceGroup(
                            start + "s",
                            start,
                            start + 9,
                            averagePrice(entry.getValue()),
                            entry.getValue().size()
                    );
                })
                .toList();
    }

    private static List<SquareFootagePriceGroup> averagePriceBySquareFootageBand(
            List<PropertyRecord> properties
    ) {
        return groupBy(
                properties,
                property -> (long) Math.floor(
                        property.squareFootage() / SQUARE_FOOTAGE_BUCKET_WIDTH
                ) * SQUARE_FOOTAGE_BUCKET_WIDTH
        ).entrySet().stream()
                .map(entry -> {
                    long lower = entry.getKey();
                    long upperExclusive = lower + SQUARE_FOOTAGE_BUCKET_WIDTH;
                    return new SquareFootagePriceGroup(
                            lower + "-" + (upperExclusive - 1),
                            lower,
                            upperExclusive,
                            averagePrice(entry.getValue()),
                            entry.getValue().size()
                    );
                })
                .toList();
    }

    private static <K extends Comparable<K>> Map<K, List<PropertyRecord>> groupBy(
            List<PropertyRecord> properties,
            Function<PropertyRecord, K> classifier
    ) {
        return properties.stream().collect(Collectors.groupingBy(
                classifier,
                TreeMap::new,
                Collectors.toList()
        ));
    }

    private static BigDecimal averagePrice(List<PropertyRecord> properties) {
        return decimal(Mean.of(prices(properties)).getAsDouble());
    }

    private static double[] prices(List<PropertyRecord> properties) {
        return properties.stream()
                .mapToDouble(PropertyRecord::price)
                .toArray();
    }

    private static BigDecimal decimal(double value) {
        return BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP);
    }

    private static FilterOptions filterOptions(List<PropertyRecord> properties) {
        return new FilterOptions(
                new DoubleRange(
                        properties.stream()
                                .mapToDouble(PropertyRecord::squareFootage)
                                .min()
                                .orElseThrow(),
                        properties.stream()
                                .mapToDouble(PropertyRecord::squareFootage)
                                .max()
                                .orElseThrow()
                ),
                properties.stream()
                        .map(PropertyRecord::bedrooms)
                        .distinct()
                        .sorted()
                        .toList(),
                properties.stream()
                        .map(PropertyRecord::bathrooms)
                        .distinct()
                        .sorted()
                        .toList(),
                new IntegerRange(
                        properties.stream()
                                .mapToInt(PropertyRecord::yearBuilt)
                                .min()
                                .orElseThrow(),
                        properties.stream()
                                .mapToInt(PropertyRecord::yearBuilt)
                                .max()
                                .orElseThrow()
                ),
                doubleRange(properties, PropertyRecord::lotSize),
                doubleRange(properties, PropertyRecord::distanceToCityCenter),
                doubleRange(properties, PropertyRecord::schoolRating),
                new LongRange(
                        properties.stream()
                                .mapToLong(PropertyRecord::price)
                                .min()
                                .orElseThrow(),
                        properties.stream()
                                .mapToLong(PropertyRecord::price)
                                .max()
                                .orElseThrow()
                )
        );
    }

    private static DoubleRange doubleRange(
            List<PropertyRecord> properties,
            java.util.function.ToDoubleFunction<PropertyRecord> value
    ) {
        return new DoubleRange(
                properties.stream().mapToDouble(value).min().orElseThrow(),
                properties.stream().mapToDouble(value).max().orElseThrow()
        );
    }
}
