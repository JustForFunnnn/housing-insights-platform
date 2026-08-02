package com.housinginsights.market.application;

import com.housinginsights.market.data.PropertyDataset;
import com.housinginsights.market.domain.MarketAnalysis;
import com.housinginsights.market.domain.MarketAnalysis.AvailableFilters;
import com.housinginsights.market.domain.MarketAnalysis.BedroomPriceGroup;
import com.housinginsights.market.domain.MarketAnalysis.ChartData;
import com.housinginsights.market.domain.MarketAnalysis.DoubleRange;
import com.housinginsights.market.domain.MarketAnalysis.IntegerRange;
import com.housinginsights.market.domain.MarketAnalysis.LongRange;
import com.housinginsights.market.domain.MarketAnalysis.PriceDistributionGroup;
import com.housinginsights.market.domain.MarketAnalysis.PriceSummary;
import com.housinginsights.market.domain.MarketAnalysis.SquareFootagePriceGroup;
import com.housinginsights.market.domain.MarketAnalysis.YearBuiltDecadePriceGroup;
import com.housinginsights.market.domain.MarketFilter;
import com.housinginsights.market.domain.Property;
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
    static final long PRICE_BUCKET_WIDTH = 50000;
    static final long SQUARE_FOOTAGE_BUCKET_WIDTH = 500;

    private final PropertyQueryService propertyQueryService;
    private final AvailableFilters availableFilters;

    public MarketAnalysisCalculator(PropertyQueryService propertyQueryService, PropertyDataset dataset) {
        this.propertyQueryService = propertyQueryService;
        this.availableFilters = availableFilters(dataset.properties());
    }

    public MarketAnalysis calculate(MarketFilter filter) {
        List<Property> properties = propertyQueryService.findAll(filter);
        if (properties.isEmpty()) {
            return new MarketAnalysis(
                    0,
                    new PriceSummary(null, null, null, null),
                    new ChartData(List.of(), List.of(), List.of(), List.of()));
        }

        return new MarketAnalysis(
                properties.size(),
                priceSummary(properties),
                new ChartData(
                        priceDistribution(properties),
                        averagePriceByBedrooms(properties),
                        averagePriceByYearBuiltDecade(properties),
                        averagePriceBySquareFootageBand(properties)));
    }

    public AvailableFilters availableFilters() {
        return availableFilters;
    }

    private static PriceSummary priceSummary(List<Property> properties) {
        double[] prices = prices(properties);
        long minimum = properties.stream().mapToLong(Property::price).min().orElseThrow();
        long maximum = properties.stream().mapToLong(Property::price).max().orElseThrow();
        return new PriceSummary(
                minimum,
                maximum,
                decimal(Mean.of(prices).getAsDouble()),
                decimal(Median.withDefaults().evaluate(prices)));
    }

    private static List<PriceDistributionGroup> priceDistribution(List<Property> properties) {
        Map<Long, Long> counts = properties.stream()
                .collect(Collectors.groupingBy(
                        property -> Math.floorDiv(property.price(), PRICE_BUCKET_WIDTH) * PRICE_BUCKET_WIDTH,
                        TreeMap::new,
                        Collectors.counting()));
        return counts.entrySet().stream()
                .map(entry -> {
                    long lower = entry.getKey();
                    Long upperExclusive =
                            lower > Long.MAX_VALUE - PRICE_BUCKET_WIDTH ? null : lower + PRICE_BUCKET_WIDTH;
                    return new PriceDistributionGroup(lower, upperExclusive, entry.getValue());
                })
                .toList();
    }

    private static List<BedroomPriceGroup> averagePriceByBedrooms(List<Property> properties) {
        return groupBy(properties, Property::bedrooms).entrySet().stream()
                .map(entry -> new BedroomPriceGroup(
                        entry.getKey(),
                        averagePrice(entry.getValue()),
                        entry.getValue().size()))
                .toList();
    }

    private static List<YearBuiltDecadePriceGroup> averagePriceByYearBuiltDecade(List<Property> properties) {
        return groupBy(properties, property -> Math.floorDiv(property.yearBuilt(), 10) * 10).entrySet().stream()
                .map(entry -> {
                    int start = entry.getKey();
                    return new YearBuiltDecadePriceGroup(
                            start,
                            start + 9,
                            averagePrice(entry.getValue()),
                            entry.getValue().size());
                })
                .toList();
    }

    private static List<SquareFootagePriceGroup> averagePriceBySquareFootageBand(List<Property> properties) {
        return groupBy(
                        properties,
                        property -> (long) Math.floor(property.squareFootage() / SQUARE_FOOTAGE_BUCKET_WIDTH)
                                * SQUARE_FOOTAGE_BUCKET_WIDTH)
                .entrySet()
                .stream()
                .map(entry -> {
                    long lower = entry.getKey();
                    long upperExclusive = lower + SQUARE_FOOTAGE_BUCKET_WIDTH;
                    return new SquareFootagePriceGroup(
                            lower,
                            upperExclusive,
                            averagePrice(entry.getValue()),
                            entry.getValue().size());
                })
                .toList();
    }

    private static <K extends Comparable<K>> Map<K, List<Property>> groupBy(
            List<Property> properties, Function<Property, K> classifier) {
        return properties.stream().collect(Collectors.groupingBy(classifier, TreeMap::new, Collectors.toList()));
    }

    private static BigDecimal averagePrice(List<Property> properties) {
        return decimal(Mean.of(prices(properties)).getAsDouble());
    }

    private static double[] prices(List<Property> properties) {
        return properties.stream().mapToDouble(Property::price).toArray();
    }

    private static BigDecimal decimal(double value) {
        return BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP);
    }

    private static AvailableFilters availableFilters(List<Property> properties) {
        return new AvailableFilters(
                new DoubleRange(
                        properties.stream()
                                .mapToDouble(Property::squareFootage)
                                .min()
                                .orElseThrow(),
                        properties.stream()
                                .mapToDouble(Property::squareFootage)
                                .max()
                                .orElseThrow()),
                properties.stream().map(Property::bedrooms).distinct().sorted().toList(),
                properties.stream().map(Property::bathrooms).distinct().sorted().toList(),
                new IntegerRange(
                        properties.stream().mapToInt(Property::yearBuilt).min().orElseThrow(),
                        properties.stream().mapToInt(Property::yearBuilt).max().orElseThrow()),
                doubleRange(properties, Property::lotSize),
                doubleRange(properties, Property::distanceToCityCenter),
                doubleRange(properties, Property::schoolRating),
                new LongRange(
                        properties.stream().mapToLong(Property::price).min().orElseThrow(),
                        properties.stream().mapToLong(Property::price).max().orElseThrow()));
    }

    private static DoubleRange doubleRange(
            List<Property> properties, java.util.function.ToDoubleFunction<Property> value) {
        return new DoubleRange(
                properties.stream().mapToDouble(value).min().orElseThrow(),
                properties.stream().mapToDouble(value).max().orElseThrow());
    }
}
