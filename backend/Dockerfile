# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-21-alpine AS build
WORKDIR /app

# Cache dependencies separately from source (faster rebuilds)
COPY pom.xml .
RUN mvn dependency:go-offline -B -q

COPY src ./src
RUN mvn package -DskipTests -B -q

# ── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Non-root user for security
RUN addgroup -S pianorep && adduser -S pianorep -G pianorep

# Copy JAR from build stage
COPY --from=build /app/target/pianorep-backend-*.jar app.jar

# Directory for incipit images (populate via Cloud Storage or image bundle)
RUN mkdir -p /app/images && chown pianorep:pianorep /app/images

USER pianorep

EXPOSE 8080

ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-jar", "app.jar"]
