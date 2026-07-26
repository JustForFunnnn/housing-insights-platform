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

export const propertyInputSchema = z.object({
  square_footage: z.number(),
  bedrooms: z.number(),
  bathrooms: z.number(),
  year_built: z.number(),
  lot_size: z.number(),
  distance_to_city_center: z.number(),
  school_rating: z.number(),
});
export type PropertyInput = z.infer<typeof propertyInputSchema>;

export const featureMetadataSchema = z.object({
  min: z.number(),
  max: z.number(),
  unit: z.string().nullable(),
});
export type FeatureMetadata = z.infer<typeof featureMetadataSchema>;

export const propertyMetadataSchema = z.object({
  features: z.record(featureKeySchema, featureMetadataSchema),
  price_currency: z.string(),
});
export type PropertyMetadata = z.infer<typeof propertyMetadataSchema>;

export const errorResponseSchema = z.object({
  error_code: z.string(),
  message: z.string(),
});
export type ErrorResponse = z.infer<typeof errorResponseSchema>;

export const estimateRecordSchema = z.object({
  property: propertyInputSchema,
  estimated_price: z.number(),
  created_at: z.string(),
});
export type EstimateRecord = z.infer<typeof estimateRecordSchema>;

export const estimateBatchSchema = z.object({
  estimates: z.array(estimateRecordSchema),
});
export type EstimateBatch = z.infer<typeof estimateBatchSchema>;

export const estimatePageSchema = estimateBatchSchema.extend({
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
});
export type EstimatePage = z.infer<typeof estimatePageSchema>;

export const numberRangeSchema = z.object({
  minimum: z.number(),
  maximum: z.number(),
});
export type NumberRange = z.infer<typeof numberRangeSchema>;

export const filterOptionsSchema = z.object({
  square_footage: numberRangeSchema,
  bedrooms: z.array(z.number()),
  bathrooms: z.array(z.number()),
  year_built: numberRangeSchema,
  lot_size: numberRangeSchema,
  distance_to_city_center: numberRangeSchema,
  school_rating: numberRangeSchema,
  price: numberRangeSchema,
});
export type FilterOptions = z.infer<typeof filterOptionsSchema>;

export const marketMetadataSchema = propertyMetadataSchema.extend({
  filter_options: filterOptionsSchema,
});
export type MarketMetadata = z.infer<typeof marketMetadataSchema>;

export const priceSummarySchema = z.object({
  minimum: z.number().nullable(),
  maximum: z.number().nullable(),
  average: z.number().nullable(),
  median: z.number().nullable(),
});
export type PriceSummary = z.infer<typeof priceSummarySchema>;

export const priceDistributionBucketSchema = z.object({
  label: z.string(),
  lower_bound: z.number(),
  upper_bound: z.number(),
  count: z.number(),
});
export type PriceDistributionBucket = z.infer<typeof priceDistributionBucketSchema>;

export const averagePriceGroupSchema = z.object({
  label: z.string().optional(),
  bedrooms: z.number().optional(),
  start_year: z.number().optional(),
  end_year: z.number().optional(),
  lower_bound: z.number().optional(),
  upper_bound_exclusive: z.number().optional(),
  average_price: z.number(),
  count: z.number(),
});
export type AveragePriceGroup = z.infer<typeof averagePriceGroupSchema>;

const averagePriceByBedroomsSchema = averagePriceGroupSchema.extend({
  bedrooms: z.number(),
});

const averagePriceByYearBuiltDecadeSchema = averagePriceGroupSchema.extend({
  label: z.string(),
  start_year: z.number(),
  end_year: z.number(),
});

const averagePriceBySquareFootageBandSchema = averagePriceGroupSchema.extend({
  label: z.string(),
  lower_bound: z.number(),
  upper_bound_exclusive: z.number(),
});

export const marketAnalysisSchema = z.object({
  count: z.number(),
  price_summary: priceSummarySchema,
  visualisations: z.object({
    price_distribution: z.array(priceDistributionBucketSchema),
    average_price_by_bedrooms: z.array(averagePriceByBedroomsSchema),
    average_price_by_year_built_decade: z.array(averagePriceByYearBuiltDecadeSchema),
    average_price_by_square_footage_band: z.array(averagePriceBySquareFootageBandSchema),
  }),
  filter_options: filterOptionsSchema,
});
export type MarketAnalysis = z.infer<typeof marketAnalysisSchema>;

export const propertyRecordSchema = propertyInputSchema.extend({
  id: z.number(),
  price: z.number(),
});
export type PropertyRecord = z.infer<typeof propertyRecordSchema>;

export const sortFieldSchema = z.enum(["id", ...FEATURE_KEYS, "price"]);
export type SortField = z.infer<typeof sortFieldSchema>;

export const sortDirectionSchema = z.enum(["asc", "desc"]);
export type SortDirection = z.infer<typeof sortDirectionSchema>;

export const propertyPageSchema = z.object({
  records: z.array(propertyRecordSchema),
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
  sort_by: sortFieldSchema,
  sort_direction: sortDirectionSchema,
});
export type PropertyPage = z.infer<typeof propertyPageSchema>;

export const whatIfRequestSchema = z.object({
  baseline: propertyInputSchema,
  scenarios: z.array(propertyInputSchema.partial()),
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
