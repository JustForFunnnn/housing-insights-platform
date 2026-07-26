/* Generated from the live backend OpenAPI document. Do not edit. */
export interface paths {
    "/api/estimates": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Estimates */
        get: operations["list_estimates_api_estimates_get"];
        put?: never;
        /** Create Estimates */
        post: operations["create_estimates_api_estimates_post"];
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
        /** Estimate Metadata */
        get: operations["estimate_metadata_api_metadata_get"];
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
        /** Health */
        get: operations["health_api_health_get"];
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
        /**
         * ErrorCode
         * @enum {string}
         */
        ErrorCode: "validation_error" | "prediction_service_unavailable" | "prediction_service_invalid_response" | "database_unavailable" | "http_error" | "internal_error";
        /** ErrorResponse */
        ErrorResponse: {
            error_code: components["schemas"]["ErrorCode"];
            /** Message */
            message: string;
        };
        /** EstimateBatchResponse */
        EstimateBatchResponse: {
            /** Estimates */
            estimates: components["schemas"]["EstimateRecordResponse"][];
        };
        /** EstimatePageResponse */
        EstimatePageResponse: {
            /** Estimates */
            estimates: components["schemas"]["EstimateRecordResponse"][];
            /** Total */
            total: number;
            /** Limit */
            limit: number;
            /** Offset */
            offset: number;
        };
        /** EstimateRecordResponse */
        EstimateRecordResponse: {
            property: components["schemas"]["PropertyResponse"];
            /**
             * Estimated Price
             * Format: int64
             */
            estimated_price: number;
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
        };
        /** EstimateRequest */
        EstimateRequest: {
            /** Properties */
            properties: components["schemas"]["PropertyInput"][];
        };
        /** HealthResponse */
        HealthResponse: {
            /**
             * Status
             * @constant
             */
            status: "ok";
        };
        /** PriceMetadataResponse */
        PriceMetadataResponse: {
            /** Unit */
            unit: string;
        };
        /** PropertyFieldMetadataResponse */
        PropertyFieldMetadataResponse: {
            /** Min */
            min: number;
            /** Max */
            max: number;
            /** Unit */
            unit: string | null;
        };
        /** PropertyInput */
        PropertyInput: {
            /**
             * Square Footage
             * @example 1850
             */
            square_footage: number;
            /**
             * Bedrooms
             * @example 3
             */
            bedrooms: number;
            /**
             * Bathrooms
             * @example 2.5
             */
            bathrooms: number;
            /**
             * Year Built
             * @example 1998
             */
            year_built: number;
            /**
             * Lot Size
             * @example 7500
             */
            lot_size: number;
            /**
             * Distance To City Center
             * @example 5.6
             */
            distance_to_city_center: number;
            /**
             * School Rating
             * @example 8.2
             */
            school_rating: number;
        };
        /** PropertyMetadataFieldsResponse */
        PropertyMetadataFieldsResponse: {
            square_footage: components["schemas"]["PropertyFieldMetadataResponse"];
            bedrooms: components["schemas"]["PropertyFieldMetadataResponse"];
            bathrooms: components["schemas"]["PropertyFieldMetadataResponse"];
            year_built: components["schemas"]["PropertyFieldMetadataResponse"];
            lot_size: components["schemas"]["PropertyFieldMetadataResponse"];
            distance_to_city_center: components["schemas"]["PropertyFieldMetadataResponse"];
            school_rating: components["schemas"]["PropertyFieldMetadataResponse"];
        };
        /** PropertyMetadataResponse */
        PropertyMetadataResponse: {
            fields: components["schemas"]["PropertyMetadataFieldsResponse"];
            price: components["schemas"]["PriceMetadataResponse"];
        };
        /** PropertyResponse */
        PropertyResponse: {
            /** Square Footage */
            square_footage: number;
            /** Bedrooms */
            bedrooms: number;
            /** Bathrooms */
            bathrooms: number;
            /** Year Built */
            year_built: number;
            /** Lot Size */
            lot_size: number;
            /** Distance To City Center */
            distance_to_city_center: number;
            /** School Rating */
            school_rating: number;
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
    list_estimates_api_estimates_get: {
        parameters: {
            query?: {
                limit?: number;
                offset?: number;
            };
            header?: {
                /** @description Optional UUID4 request identifier. Valid values are preserved exactly; missing or invalid values are replaced with a compact UUID4. */
                "X-Request-ID"?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    /** @description The active request correlation identifier. */
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EstimatePageResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    /** @description The active request correlation identifier. */
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
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
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    /** @description The active request correlation identifier. */
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    create_estimates_api_estimates_post: {
        parameters: {
            query?: never;
            header?: {
                /** @description Optional UUID4 request identifier. Valid values are preserved exactly; missing or invalid values are replaced with a compact UUID4. */
                "X-Request-ID"?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["EstimateRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    /** @description The active request correlation identifier. */
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EstimateBatchResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    /** @description The active request correlation identifier. */
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
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
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Bad Gateway */
            502: {
                headers: {
                    /** @description The active request correlation identifier. */
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    /** @description The active request correlation identifier. */
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    estimate_metadata_api_metadata_get: {
        parameters: {
            query?: never;
            header?: {
                /** @description Optional UUID4 request identifier. Valid values are preserved exactly; missing or invalid values are replaced with a compact UUID4. */
                "X-Request-ID"?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    /** @description The active request correlation identifier. */
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PropertyMetadataResponse"];
                };
            };
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    /** @description The active request correlation identifier. */
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
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
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    /** @description The active request correlation identifier. */
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    health_api_health_get: {
        parameters: {
            query?: never;
            header?: {
                /** @description Optional UUID4 request identifier. Valid values are preserved exactly; missing or invalid values are replaced with a compact UUID4. */
                "X-Request-ID"?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
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
            /** @description Unprocessable Entity */
            422: {
                headers: {
                    /** @description The active request correlation identifier. */
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
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
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    /** @description The active request correlation identifier. */
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
}
