package com.housinginsights.market.export;

import com.housinginsights.market.domain.MarketAnalysis;
import com.housinginsights.market.error.ExportGenerationException;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import org.knowm.xchart.BitmapEncoder;
import org.knowm.xchart.CategoryChart;
import org.knowm.xchart.CategoryChartBuilder;
import org.springframework.stereotype.Component;

@Component
public class MarketChartRenderer {

    public List<RenderedChart> render(MarketAnalysis analysis) {
        if (analysis.count() == 0) {
            return List.of();
        }

        try {
            List<RenderedChart> charts = new ArrayList<>();
            charts.add(renderChart(
                    "Price Distribution",
                    "Price range",
                    "Properties",
                    analysis.visualisations().priceDistribution().stream()
                            .map(MarketAnalysis.PriceDistributionBucket::label)
                            .toList(),
                    analysis.visualisations().priceDistribution().stream()
                            .map(MarketAnalysis.PriceDistributionBucket::count)
                            .toList()
            ));
            charts.add(renderChart(
                    "Average Price by Bedrooms",
                    "Bedrooms",
                    "Average price",
                    analysis.visualisations().averagePriceByBedrooms().stream()
                            .map(group -> Integer.toString(group.bedrooms()))
                            .toList(),
                    analysis.visualisations().averagePriceByBedrooms().stream()
                            .map(MarketAnalysis.BedroomPriceGroup::averagePrice)
                            .toList()
            ));
            charts.add(renderChart(
                    "Average Price by Build Decade",
                    "Build decade",
                    "Average price",
                    analysis.visualisations().averagePriceByYearBuiltDecade()
                            .stream()
                            .map(MarketAnalysis.YearDecadePriceGroup::label)
                            .toList(),
                    analysis.visualisations().averagePriceByYearBuiltDecade()
                            .stream()
                            .map(MarketAnalysis.YearDecadePriceGroup::averagePrice)
                            .toList()
            ));
            charts.add(renderChart(
                    "Average Price by Square Footage",
                    "Square footage band",
                    "Average price",
                    analysis.visualisations().averagePriceBySquareFootageBand()
                            .stream()
                            .map(MarketAnalysis.SquareFootagePriceGroup::label)
                            .toList(),
                    analysis.visualisations().averagePriceBySquareFootageBand()
                            .stream()
                            .map(MarketAnalysis.SquareFootagePriceGroup::averagePrice)
                            .toList()
            ));
            return List.copyOf(charts);
        } catch (IOException exception) {
            throw new ExportGenerationException("chart rendering failed", exception);
        }
    }

    private static RenderedChart renderChart(
            String title,
            String xAxis,
            String yAxis,
            List<String> categories,
            List<? extends Number> values
    ) throws IOException {
        CategoryChart chart = new CategoryChartBuilder()
                .width(900)
                .height(500)
                .title(title)
                .xAxisTitle(xAxis)
                .yAxisTitle(yAxis)
                .build();
        chart.getStyler().setLegendVisible(false);
        chart.addSeries(title, categories, values);
        return new RenderedChart(
                title,
                BitmapEncoder.getBitmapBytes(chart, BitmapEncoder.BitmapFormat.PNG)
        );
    }

    public record RenderedChart(String title, byte[] png) {
        public RenderedChart {
            png = png.clone();
        }

        @Override
        public byte[] png() {
            return png.clone();
        }
    }
}
