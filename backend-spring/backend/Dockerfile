# syntax=docker/dockerfile:1
# ── Spring Boot (API arbre / Neo4j) ─────────────────────────────────────────

# 1) Build du jar
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build
COPY pom.xml .
# Dépendances téléchargées dans une couche à part : un rebuild après une simple
# modif de code ne les retélécharge pas.
RUN --mount=type=cache,target=/root/.m2 mvn -B -q dependency:go-offline
COPY src ./src
# -DskipTests : le test contextLoads a besoin d'un Neo4j qui n'existe pas au build
RUN --mount=type=cache,target=/root/.m2 mvn -B -q -DskipTests package \
 && cp target/*.jar /build/app.jar

# 2) Image d'exécution : JRE seul, utilisateur non root
FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S app && adduser -S -G app -H app
WORKDIR /app
COPY --from=build /build/app.jar /app/app.jar
USER app
EXPOSE 8070
# MaxRAMPercentage : la JVM s'adapte à la limite mémoire du conteneur (mem_limit)
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-Djava.io.tmpdir=/tmp", "-jar", "/app/app.jar"]
