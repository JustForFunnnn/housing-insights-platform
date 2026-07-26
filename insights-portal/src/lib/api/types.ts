import type { components as EstimatorComponents } from "./generated/estimator";
import type { components as MarketComponents } from "./generated/market";

export const FEATURE_KEYS = [
  "square_footage",
  "bedrooms",
  "bathrooms",
  "year_built",
  "lot_size",
  "distance_to_city_center",
  "school_rating",
] as const;

export type FeatureKey = (typeof FEATURE_KEYS)[number];
export type PropertyInput =
  EstimatorComponents["schemas"]["PropertyInput"];

export interface FieldMetadata {
  min: number;
  max: number;
  unit: string | null;
}

export interface PropertyMetadata {
  fields: Record<FeatureKey, FieldMetadata>;
  price: { unit: string };
}

export interface ErrorResponse {
  error_code: string;
  message: string;
}

export interface EstimateRecord {
  property: PropertyInput;
  estimated_price: number;
  created_at: string;
}

export interface EstimateBatch {
  estimates: EstimateRecord[];
}

export interface EstimatePage extends EstimateBatch {
  total: number;
  limit: number;
  offset: number;
}

export interface NumberRange {
  minimum: number;
  maximum: number;
}

export interface FilterOptions {
  square_footage: NumberRange;
  bedrooms: number[];
  bathrooms: number[];
  year_built: NumberRange;
  lot_size: NumberRange;
  distance_to_city_center: NumberRange;
  school_rating: NumberRange;
  price: NumberRange;
}

export interface MarketMetadata extends PropertyMetadata {
  filter_options: FilterOptions;
}

export interface PriceSummary {
  minimum: number | null;
  maximum: number | null;
  average: number | null;
  median: number | null;
}

export interface PriceDistributionBucket {
  label: string;
  lower_bound: number;
  upper_bound: number;
  count: number;
}

export interface AveragePriceGroup {
  label?: string;
  bedrooms?: number;
  start_year?: number;
  end_year?: number;
  lower_bound?: number;
  upper_bound_exclusive?: number;
  average_price: number;
  count: number;
}

export interface MarketAnalysis {
  count: number;
  price_summary: PriceSummary;
  visualisations: {
    price_distribution: PriceDistributionBucket[];
    average_price_by_bedrooms: Array<
      AveragePriceGroup & { bedrooms: number }
    >;
    average_price_by_year_built_decade: Array<
      AveragePriceGroup & {
        label: string;
        start_year: number;
        end_year: number;
      }
    >;
    average_price_by_square_footage_band: Array<
      AveragePriceGroup & {
        label: string;
        lower_bound: number;
        upper_bound_exclusive: number;
      }
    >;
  };
  filter_options: FilterOptions;
}

export interface PropertyRecord extends PropertyInput {
  id: number;
  price: number;
}

export interface PropertyPage {
  records: PropertyRecord[];
  total: number;
  limit: number;
  offset: number;
  sort_by: SortField;
  sort_direction: SortDirection;
}

export type SortField =
  | "id"
  | FeatureKey
  | "price";
export type SortDirection = "asc" | "desc";

export interface WhatIfResponse {
  baseline_prediction: number;
  scenarios: Array<{
    predicted_price: number;
    price_difference: number;
    percentage_difference: number;
  }>;
}

export type MarketOpenApiSchemas = MarketComponents["schemas"];
