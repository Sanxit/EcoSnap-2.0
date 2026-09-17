FROM maven:3.9-eclipse-temurin-25 AS build
WORKDIR /app
COPY pom.xml .mvn mvnw ./
RUN chmod +x mvnw && ./mvnw -B dependency:go-offline
COPY src ./src
RUN chmod +x mvnw && ./mvnw -B -DskipTests package
FROM eclipse-temurin:25-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
CMD ["java", "-jar", "app.jar"]
