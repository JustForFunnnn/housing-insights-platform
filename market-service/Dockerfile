# syntax=docker/dockerfile:1.7

FROM maven:3.9.16-eclipse-temurin-21 AS build

WORKDIR /workspace

COPY market-service/pom.xml ./
RUN --mount=type=cache,target=/root/.m2 \
    mvn -B dependency:go-offline

COPY market-service/src/ src/
RUN --mount=type=cache,target=/root/.m2 \
    mvn -B -DskipTests package

FROM eclipse-temurin:21-jre-noble

RUN apt-get update && \
    apt-get install --no-install-recommends -y \
        curl && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV MARKET_DATASET_PATH="/app/data/House Price Dataset.csv" \
    PROPERTY_METADATA_PATH=/app/contracts/property-field-metadata.json \
    PREDICTION_SERVICE_URL=http://prediction-service:9000 \
    PREDICTION_SERVICE_TIMEOUT_SECONDS=5

COPY --from=build /workspace/target/market-service-0.1.0.jar app.jar
COPY ["data/House Price Dataset.csv", "data/House Price Dataset.csv"]
COPY contracts/property-field-metadata.json contracts/property-field-metadata.json
RUN chmod 0444 "data/House Price Dataset.csv"

EXPOSE 9002

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
