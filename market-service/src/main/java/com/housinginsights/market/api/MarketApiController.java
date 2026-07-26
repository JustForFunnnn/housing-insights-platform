package com.housinginsights.market.api;

import com.housinginsights.market.observability.RequestCorrelation;
import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@RestController
@RequestMapping("/api")
@CrossOrigin(
        origins = {"http://localhost:9100", "http://host.docker.internal:9100"},
        exposedHeaders = RequestCorrelation.HEADER_NAME)
public @interface MarketApiController {}
