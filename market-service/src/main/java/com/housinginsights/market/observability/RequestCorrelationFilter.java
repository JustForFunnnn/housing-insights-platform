package com.housinginsights.market.observability;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RequestCorrelationFilter extends OncePerRequestFilter {
    private static final Logger logger =
            LoggerFactory.getLogger(RequestCorrelationFilter.class);

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String supplied = request.getHeader(RequestCorrelation.HEADER_NAME);
        String requestId = RequestCorrelation.isUuid4(supplied)
                ? supplied
                : RequestCorrelation.createUuid4();

        MDC.put(RequestCorrelation.MDC_KEY, requestId);
        response.setHeader(RequestCorrelation.HEADER_NAME, requestId);
        try {
            filterChain.doFilter(request, response);
        } finally {
            logger.info(
                    "request_completed method={} path={} status={}",
                    request.getMethod(),
                    request.getRequestURI(),
                    response.getStatus()
            );
            MDC.remove(RequestCorrelation.MDC_KEY);
        }
    }
}
