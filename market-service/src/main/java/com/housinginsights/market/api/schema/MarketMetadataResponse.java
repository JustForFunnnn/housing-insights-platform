package com.housinginsights.market.api.schema;

import com.housinginsights.market.domain.MarketAnalysis;
import com.housinginsights.market.metadata.PropertyMetadata;
import java.util.List;

public record MarketMetadataResponse(
        PropertyMetadataFeaturesResponse features, String priceCurrency, FilterOptions filterOptions) {
    public static MarketMetadataResponse from(
            PropertyMetadata propertyMetadata, MarketAnalysis.FilterOptions filterOptions) {
        return new MarketMetadataResponse(
                PropertyMetadataFeaturesResponse.from(propertyMetadata),
                propertyMetadata.priceCurrency(),
                FilterOptions.from(filterOptions));
    }

    public record FilterOptions(
            DoubleRange squareFootage,
            List<Integer> bedrooms,
            List<Double> bathrooms,
            IntegerRange yearBuilt,
            DoubleRange lotSize,
            DoubleRange distanceToCityCenter,
            DoubleRange schoolRating,
            LongRange price) {
        public FilterOptions {
            bedrooms = List.copyOf(bedrooms);
            bathrooms = List.copyOf(bathrooms);
        }

        private static FilterOptions from(MarketAnalysis.FilterOptions options) {
            return new FilterOptions(
                    DoubleRange.from(options.squareFootage()),
                    options.bedrooms(),
                    options.bathrooms(),
                    IntegerRange.from(options.yearBuilt()),
                    DoubleRange.from(options.lotSize()),
                    DoubleRange.from(options.distanceToCityCenter()),
                    DoubleRange.from(options.schoolRating()),
                    LongRange.from(options.price()));
        }
    }

    public record DoubleRange(double minimum, double maximum) {
        private static DoubleRange from(MarketAnalysis.DoubleRange range) {
            return new DoubleRange(range.minimum(), range.maximum());
        }
    }

    public record IntegerRange(int minimum, int maximum) {
        private static IntegerRange from(MarketAnalysis.IntegerRange range) {
            return new IntegerRange(range.minimum(), range.maximum());
        }
    }

    public record LongRange(long minimum, long maximum) {
        private static LongRange from(MarketAnalysis.LongRange range) {
            return new LongRange(range.minimum(), range.maximum());
        }
    }
}
