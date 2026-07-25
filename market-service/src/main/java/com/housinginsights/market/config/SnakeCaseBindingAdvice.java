package com.housinginsights.market.config;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import org.springframework.web.bind.WebDataBinder;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.InitBinder;

@ControllerAdvice
public class SnakeCaseBindingAdvice {
    @InitBinder
    void useSnakeCaseConstructorParameterNames(WebDataBinder binder) {
        binder.setNameResolver(parameter -> {
            String parameterName = parameter.getParameterName();
            return parameterName == null
                    ? null
                    : PropertyNamingStrategies.SNAKE_CASE.nameForField(
                            null, null, parameterName);
        });
    }
}
