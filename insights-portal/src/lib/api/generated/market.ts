/* Generated from the live backend OpenAPI document. Do not edit. */
export interface paths {
    "/api/what-if": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["whatIf"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/properties": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["properties"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/properties/export/csv": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["csv"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/metadata": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["metadata"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/health": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["health"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/analysis": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["analysis"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        ApiErrorResponse: {
            error_code: string;
            message: string;
        };
        PropertyFeaturesRequest: {
            /**
             * Format: double
             * @example 1850
             */
            square_footage: number;
            /**
             * Format: int32
             * @example 3
             */
            bedrooms: number;
            /**
             * Format: double
             * @example 2.5
             */
            bathrooms: number;
            /**
             * Format: int32
             * @example 2005
             */
            year_built: number;
            /**
             * Format: double
             * @example 7500
             */
            lot_size: number;
            /**
             * Format: double
             * @example 8.5
             */
            distance_to_city_center: number;
            /**
             * Format: double
             * @example 8.2
             */
            school_rating: number;
        };
        WhatIfRequest: {
            baseline: components["schemas"]["PropertyFeaturesRequest"];
            scenarios: components["schemas"]["PropertyFeaturesRequest"][];
        };
        ScenarioResponse: {
            /** Format: int64 */
            predicted_price: number;
            /** Format: int64 */
            price_difference: number;
            percentage_difference: number;
        };
        WhatIfResponse: {
            /** Format: int64 */
            baseline_prediction: number;
            scenarios: components["schemas"]["ScenarioResponse"][];
        };
        PropertyPageResponse: {
            records: components["schemas"]["PropertyResponse"][];
            /** Format: int64 */
            total: number;
            /** Format: int32 */
            limit: number;
            /** Format: int32 */
            offset: number;
            sort_by: string;
            sort_direction: string;
        };
        PropertyResponse: {
            /** Format: int64 */
            id?: number;
            /** Format: double */
            square_footage?: number;
            /** Format: int32 */
            bedrooms?: number;
            /** Format: double */
            bathrooms?: number;
            /** Format: int32 */
            year_built?: number;
            /** Format: double */
            lot_size?: number;
            /** Format: double */
            distance_to_city_center?: number;
            /** Format: double */
            school_rating?: number;
            /** Format: int64 */
            price?: number;
        };
        DoubleRange: {
            /** Format: double */
            minimum?: number;
            /** Format: double */
            maximum?: number;
        };
        FilterOptions: {
            square_footage?: components["schemas"]["DoubleRange"];
            bedrooms?: number[];
            bathrooms?: number[];
            year_built?: components["schemas"]["IntegerRange"];
            lot_size?: components["schemas"]["DoubleRange"];
            distance_to_city_center?: components["schemas"]["DoubleRange"];
            school_rating?: components["schemas"]["DoubleRange"];
            price?: components["schemas"]["LongRange"];
        };
        IntegerRange: {
            /** Format: int32 */
            minimum?: number;
            /** Format: int32 */
            maximum?: number;
        };
        LongRange: {
            /** Format: int64 */
            minimum?: number;
            /** Format: int64 */
            maximum?: number;
        };
        MarketMetadataResponse: {
            fields: components["schemas"]["PropertyMetadataFieldsResponse"];
            price: components["schemas"]["PriceMetadataResponse"];
            filter_options: components["schemas"]["FilterOptions"];
        };
        PriceMetadataResponse: {
            unit: string;
        };
        PropertyFieldMetadataResponse: {
            min: number;
            max: number;
            unit: string;
        };
        PropertyMetadataFieldsResponse: {
            square_footage: components["schemas"]["PropertyFieldMetadataResponse"];
            bedrooms: components["schemas"]["PropertyFieldMetadataResponse"];
            bathrooms: components["schemas"]["PropertyFieldMetadataResponse"];
            year_built: components["schemas"]["PropertyFieldMetadataResponse"];
            lot_size: components["schemas"]["PropertyFieldMetadataResponse"];
            distance_to_city_center: components["schemas"]["PropertyFieldMetadataResponse"];
            school_rating: components["schemas"]["PropertyFieldMetadataResponse"];
        };
        HealthResponse: {
            status: string;
        };
        BedroomPriceGroup: {
            /** Format: int32 */
            bedrooms?: number;
            average_price?: number;
            /** Format: int64 */
            count?: number;
        };
        MarketAnalysisResponse: {
            /** Format: int64 */
            count: number;
            price_summary: components["schemas"]["PriceSummary"];
            visualisations: components["schemas"]["Visualisations"];
            filter_options: components["schemas"]["FilterOptions"];
        };
        PriceDistributionBucket: {
            label?: string;
            /** Format: int64 */
            lower_bound?: number;
            /** Format: int64 */
            upper_bound?: number;
            /** Format: int64 */
            count?: number;
        };
        PriceSummary: {
            /** Format: int64 */
            minimum: null | number;
            /** Format: int64 */
            maximum: null | number;
            average: null | number;
            median: null | number;
        };
        SquareFootagePriceGroup: {
            label?: string;
            /** Format: int64 */
            lower_bound?: number;
            /** Format: int64 */
            upper_bound_exclusive?: number;
            average_price?: number;
            /** Format: int64 */
            count?: number;
        };
        Visualisations: {
            price_distribution?: components["schemas"]["PriceDistributionBucket"][];
            average_price_by_bedrooms?: components["schemas"]["BedroomPriceGroup"][];
            average_price_by_year_built_decade?: components["schemas"]["YearDecadePriceGroup"][];
            average_price_by_square_footage_band?: components["schemas"]["SquareFootagePriceGroup"][];
        };
        YearDecadePriceGroup: {
            label?: string;
            /** Format: int32 */
            start_year?: number;
            /** Format: int32 */
            end_year?: number;
            average_price?: number;
            /** Format: int64 */
            count?: number;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    whatIf: {
        parameters: {
            query?: never;
            header?: {
                /** @description Optional UUID4 in hyphenated or 32-character hex form. Valid values are preserved exactly; missing or invalid values are replaced with a compact UUID4. */
                "X-Request-ID"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["WhatIfRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    /** @description The active request correlation identifier. */
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WhatIfResponse"];
                };
            };
            /** @description Request validation failed. */
            422: {
                headers: {
                    /** @description The active request correlation identifier. */
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponse"];
                };
            };
            /** @description The request could not be completed. */
            500: {
                headers: {
                    /** @description The active request correlation identifier. */
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponse"];
                };
            };
            /** @description The prediction service returned an invalid response. */
            502: {
                headers: {
                    /** @description The active request correlation identifier. */
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponse"];
                };
            };
            /** @description Price estimation is temporarily unavailable. */
            503: {
                headers: {
                    /** @description The active request correlation identifier. */
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponse"];
                };
            };
        };
    };
    properties: {
        parameters: {
            query?: {
                min_square_footage?: number;
                max_square_footage?: number;
                bedrooms?: number[];
                bathrooms?: number[];
                min_year_built?: number;
                max_year_built?: number;
                min_lot_size?: number;
                max_lot_size?: number;
                min_distance_to_city_center?: number;
                max_distance_to_city_center?: number;
                min_school_rating?: number;
                max_school_rating?: number;
                min_price?: number;
                max_price?: number;
                sort_by?: "id" | "square_footage" | "bedrooms" | "bathrooms" | "year_built" | "lot_size" | "distance_to_city_center" | "school_rating" | "price";
                sort_direction?: "asc" | "desc";
                limit?: number;
                offset?: number;
            };
            header?: {
                /** @description Optional UUID4 in hyphenated or 32-character hex form. Valid values are preserved exactly; missing or invalid values are replaced with a compact UUID4. */
                "X-Request-ID"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    /** @description The active request correlation identifier. */
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PropertyPageResponse"];
                };
            };
            /** @description Request validation failed. */
            422: {
                headers: {
                    /** @description The active request correlation identifier. */
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponse"];
                };
            };
            /** @description The request could not be completed. */
            500: {
                headers: {
                    /** @description The active request correlation identifier. */
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponse"];
                };
            };
        };
    };
    csv: {
        parameters: {
            query?: {
                min_square_footage?: number;
                max_square_footage?: number;
                bedrooms?: number[];
                bathrooms?: number[];
                min_year_built?: number;
                max_year_built?: number;
                min_lot_size?: number;
                max_lot_size?: number;
                min_distance_to_city_center?: number;
                max_distance_to_city_center?: number;
                min_school_rating?: number;
                max_school_rating?: number;
                min_price?: number;
                max_price?: number;
                sort_by?: "id" | "square_footage" | "bedrooms" | "bathrooms" | "year_built" | "lot_size" | "distance_to_city_center" | "school_rating" | "price";
                sort_direction?: "asc" | "desc";
            };
            header?: {
                /** @description Optional UUID4 in hyphenated or 32-character hex form. Valid values are preserved exactly; missing or invalid values are replaced with a compact UUID4. */
                "X-Request-ID"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    /** @description The active request correlation identifier. */
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "text/csv;charset=UTF-8": string;
                };
            };
            /** @description Request validation failed. */
            422: {
                headers: {
                    /** @description The active request correlation identifier. */
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponse"];
                };
            };
            /** @description The request could not be completed. */
            500: {
                headers: {
                    /** @description The active request correlation identifier. */
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponse"];
                };
            };
        };
    };
    metadata: {
        parameters: {
            query?: never;
            header?: {
                /** @description Optional UUID4 in hyphenated or 32-character hex form. Valid values are preserved exactly; missing or invalid values are replaced with a compact UUID4. */
                "X-Request-ID"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    /** @description The active request correlation identifier. */
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MarketMetadataResponse"];
                };
            };
            /** @description Request validation failed. */
            422: {
                headers: {
                    /** @description The active request correlation identifier. */
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponse"];
                };
            };
            /** @description The request could not be completed. */
            500: {
                headers: {
                    /** @description The active request correlation identifier. */
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponse"];
                };
            };
        };
    };
    health: {
        parameters: {
            query?: never;
            header?: {
                /** @description Optional UUID4 in hyphenated or 32-character hex form. Valid values are preserved exactly; missing or invalid values are replaced with a compact UUID4. */
                "X-Request-ID"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    /** @description The active request correlation identifier. */
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HealthResponse"];
                };
            };
            /** @description The request could not be completed. */
            500: {
                headers: {
                    /** @description The active request correlation identifier. */
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponse"];
                };
            };
        };
    };
    analysis: {
        parameters: {
            query?: {
                min_square_footage?: number;
                max_square_footage?: number;
                bedrooms?: number[];
                bathrooms?: number[];
                min_year_built?: number;
                max_year_built?: number;
                min_lot_size?: number;
                max_lot_size?: number;
                min_distance_to_city_center?: number;
                max_distance_to_city_center?: number;
                min_school_rating?: number;
                max_school_rating?: number;
                min_price?: number;
                max_price?: number;
            };
            header?: {
                /** @description Optional UUID4 in hyphenated or 32-character hex form. Valid values are preserved exactly; missing or invalid values are replaced with a compact UUID4. */
                "X-Request-ID"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    /** @description The active request correlation identifier. */
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MarketAnalysisResponse"];
                };
            };
            /** @description Request validation failed. */
            422: {
                headers: {
                    /** @description The active request correlation identifier. */
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponse"];
                };
            };
            /** @description The request could not be completed. */
            500: {
                headers: {
                    /** @description The active request correlation identifier. */
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponse"];
                };
            };
        };
    };
}
