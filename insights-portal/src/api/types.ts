import { z } from "zod";

// Runtime representations of the Estimator and Market wire contracts.
export const FEATURE_KEYS = [
  "square_footage",
  "bedrooms",
  "bathrooms",
  "year_built",
  "lot_size",
  "distance_to_city_center",
  "school_rating",
] as const;

export const featureKeySchema = z.enum(FEATURE_KEYS);
export type FeatureKey = z.infer<typeof featureKeySchema>;

export const propertyFeaturesInputSchema = z.object({
  square_footage: z.number(),
  bedrooms: z.number(),
  bathrooms: z.number(),
  year_built: z.number(),
  lot_size: z.number(),
  distance_to_city_center: z.number(),
  school_rating: z.number(),
});
export type PropertyFeaturesInput = z.infer<typeof propertyFeaturesInputSchema>;

export const featureMetadataSchema = z.object({
  min: z.number(),
  max: z.number(),
  unit: z.string().nullable(),
});

export const propertyFeaturesMetadataSchema = z.record(featureKeySchema, featureMetadataSchema);

export const propertyMetadataResponseSchema = z.object({
  features: propertyFeaturesMetadataSchema,
  price_currency: z.string(),
});
export type PropertyMetadataResponse = z.infer<typeof propertyMetadataResponseSchema>;

export const errorResponseSchema = z.object({
  error_code: z.string(),
  message: z.string(),
});
export type ErrorResponse = z.infer<typeof errorResponseSchema>;

export const estimateSchema = z.object({
  property_features: propertyFeaturesInputSchema,
  estimated_price: z.number(),
  created_at: z.string(),
});

export const estimateBatchResponseSchema = z.object({
  estimates: z.array(estimateSchema),
});
export type EstimateBatchResponse = z.infer<typeof estimateBatchResponseSchema>;

export const estimatePageResponseSchema = estimateBatchResponseSchema.extend({
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
});
export type EstimatePageResponse = z.infer<typeof estimatePageResponseSchema>;

export const numberRangeSchema = z.object({
  minimum: z.number(),
  maximum: z.number(),
});

export const availableFiltersSchema = z.object({
  square_footage: numberRangeSchema,
  bedrooms: z.array(z.number()),
  bathrooms: z.array(z.number()),
  year_built: numberRangeSchema,
  lot_size: numberRangeSchema,
  distance_to_city_center: numberRangeSchema,
  school_rating: numberRangeSchema,
  price: numberRangeSchema,
});

export const marketMetadataResponseSchema = propertyMetadataResponseSchema.extend({
  available_filters: availableFiltersSchema,
});
export type MarketMetadataResponse = z.infer<typeof marketMetadataResponseSchema>;

export const priceSummarySchema = z.object({
  minimum: z.number().nullable(),
  maximum: z.number().nullable(),
  average: z.number().nullable(),
  median: z.number().nullable(),
});

export const priceDistributionGroupSchema = z.object({
  lower_bound: z.number(),
  upper_bound_exclusive: z.number().nullable(),
  count: z.number(),
});

const averagePriceGroupBaseSchema = z.object({
  average_price: z.number(),
  count: z.number(),
});

const bedroomPriceGroupSchema = averagePriceGroupBaseSchema.extend({
  bedrooms: z.number(),
});

const yearBuiltDecadePriceGroupSchema = averagePriceGroupBaseSchema.extend({
  start_year: z.number(),
  end_year: z.number(),
});

const squareFootagePriceGroupSchema = averagePriceGroupBaseSchema.extend({
  lower_bound: z.number(),
  upper_bound_exclusive: z.number(),
});

export const marketAnalysisResponseSchema = z.object({
  count: z.number(),
  price_summary: priceSummarySchema,
  chart_data: z.object({
    price_distribution: z.array(priceDistributionGroupSchema),
    average_price_by_bedrooms: z.array(bedroomPriceGroupSchema),
    average_price_by_year_built_decade: z.array(yearBuiltDecadePriceGroupSchema),
    average_price_by_square_footage_band: z.array(squareFootagePriceGroupSchema),
  }),
});
export type MarketAnalysisResponse = z.infer<typeof marketAnalysisResponseSchema>;

export const propertySchema = propertyFeaturesInputSchema.extend({
  id: z.number(),
  price: z.number(),
});

export const sortFieldSchema = z.enum(["id", ...FEATURE_KEYS, "price"]);
export type SortField = z.infer<typeof sortFieldSchema>;

export const sortDirectionSchema = z.enum(["asc", "desc"]);
export type SortDirection = z.infer<typeof sortDirectionSchema>;

export const propertyPageResponseSchema = z.object({
  properties: z.array(propertySchema),
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
  sort_by: sortFieldSchema,
  sort_direction: sortDirectionSchema,
});
export type PropertyPageResponse = z.infer<typeof propertyPageResponseSchema>;

export const whatIfRequestSchema = z.object({
  baseline: propertyFeaturesInputSchema,
  scenarios: z.array(propertyFeaturesInputSchema.partial()),
});
export type WhatIfRequest = z.infer<typeof whatIfRequestSchema>;

export const whatIfResponseSchema = z.object({
  baseline_prediction: z.number(),
  scenarios: z.array(
    z.object({
      predicted_price: z.number(),
      price_difference: z.number(),
      percentage_difference: z.number(),
    }),
  ),
});
export type WhatIfResponse = z.infer<typeof whatIfResponseSchema>;
