package com.housinginsights.market.support.observability;

import java.util.UUID;
import org.slf4j.MDC;

public final class RequestCorrelation {
    public static final String HEADER_NAME = "X-Request-ID";
    public static final String MDC_KEY = "request_id";
    private static final int COMPACT_UUID_LENGTH = 32;
    private static final int HYPHENATED_UUID_LENGTH = 36;

    private RequestCorrelation() {
    }

    public static String currentOrCreate() {
        String requestId = MDC.get(MDC_KEY);
        if (requestId == null) {
            requestId = createUuid4();
            MDC.put(MDC_KEY, requestId);
        }
        return requestId;
    }

    static boolean isUuid4(String value) {
        String parseable = toParseableUuid(value);
        if (parseable == null) {
            return false;
        }
        try {
            UUID requestId = UUID.fromString(parseable);
            return requestId.toString().equalsIgnoreCase(parseable)
                    && requestId.version() == 4
                    && requestId.variant() == 2;
        } catch (IllegalArgumentException exception) {
            return false;
        }
    }

    static String createUuid4() {
        return compact(UUID.randomUUID());
    }

    private static String toParseableUuid(String value) {
        if (value == null) {
            return null;
        }
        if (value.length() == COMPACT_UUID_LENGTH) {
            return hyphenate(value);
        }
        return value.length() == HYPHENATED_UUID_LENGTH ? value : null;
    }

    private static String hyphenate(String value) {
        return value.substring(0, 8)
                + "-" + value.substring(8, 12)
                + "-" + value.substring(12, 16)
                + "-" + value.substring(16, 20)
                + "-" + value.substring(20);
    }

    private static String compact(UUID value) {
        return value.toString().replace("-", "");
    }
}
