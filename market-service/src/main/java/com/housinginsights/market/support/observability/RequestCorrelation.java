package com.housinginsights.market.support.observability;

import java.util.UUID;
import java.util.regex.Pattern;
import org.slf4j.MDC;

public final class RequestCorrelation {
    public static final String HEADER_NAME = "X-Request-ID";
    public static final String MDC_KEY = "request_id";
    private static final Pattern COMPACT_UUID =
            Pattern.compile("^[0-9a-fA-F]{32}$");
    private static final Pattern HYPHENATED_UUID = Pattern.compile(
            "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-"
                    + "[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
    );

    private RequestCorrelation() {
    }

    public static String currentOrCreate() {
        String requestId = MDC.get(MDC_KEY);
        if (requestId == null) {
            requestId = UUID.randomUUID().toString();
            MDC.put(MDC_KEY, requestId);
        }
        return requestId;
    }

    public static boolean isUuid4(String value) {
        if (value == null || value.isBlank()) {
            return false;
        }
        try {
            String parseable = COMPACT_UUID.matcher(value).matches()
                    ? hyphenate(value)
                    : value;
            if (!HYPHENATED_UUID.matcher(parseable).matches()) {
                return false;
            }
            UUID requestId = UUID.fromString(parseable);
            return requestId.version() == 4 && requestId.variant() == 2;
        } catch (IllegalArgumentException exception) {
            return false;
        }
    }

    private static String hyphenate(String value) {
        return value.substring(0, 8)
                + "-" + value.substring(8, 12)
                + "-" + value.substring(12, 16)
                + "-" + value.substring(16, 20)
                + "-" + value.substring(20);
    }
}
