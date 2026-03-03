package io.reflectoring.demo.client;

import io.reflectoring.demo.config.ExternalApiConfig;
import io.reflectoring.demo.entity.AlertStatus;
import io.reflectoring.demo.entity.DisasterEvent;
import io.reflectoring.demo.entity.DisasterType;
import io.reflectoring.demo.entity.SeverityLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class UsgsEarthquakeClient {

    private final WebClient webClient;
    private final ExternalApiConfig config;

    @SuppressWarnings("unchecked")
    public List<DisasterEvent> fetchEarthquakes() {
        log.info("Fetching earthquakes from USGS");
        List<DisasterEvent> events = new ArrayList<>();

        try {
            Map<String, Object> response = webClient.get()
                    .uri(config.getUsgsUrl())
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response == null || !response.containsKey("features")) {
                return events;
            }

            List<Map<String, Object>> features = (List<Map<String, Object>>) response.get("features");

            for (Map<String, Object> feature : features) {
                try {
                    Map<String, Object> props = (Map<String, Object>) feature.get("properties");
                    Map<String, Object> geom = (Map<String, Object>) feature.get("geometry");
                    List<Object> coords = (List<Object>) geom.get("coordinates");

                    // Safely extract magnitude (may be null for some events)
                    Object magObj = props.get("mag");
                    double magnitude = magObj instanceof Number ? ((Number) magObj).doubleValue() : 0.0;

                    // time field comes as Long from JSON but Jackson may parse as Integer for small
                    // values
                    long timeMs = ((Number) props.get("time")).longValue();

                    // Coordinates: [longitude, latitude, depth]
                    double lon = ((Number) coords.get(0)).doubleValue();
                    double lat = ((Number) coords.get(1)).doubleValue();

                    String place = props.getOrDefault("place", "Unknown location").toString();
                    String title = props.getOrDefault("title", "Earthquake near " + place).toString();

                    DisasterEvent event = DisasterEvent.builder()
                            .title(title)
                            .description("Magnitude " + magnitude + " earthquake near " + place)
                            .disasterType(DisasterType.EARTHQUAKE)
                            .severity(SeverityLevel.MEDIUM) // overridden by categorization service
                            .latitude(lat)
                            .longitude(lon)
                            .locationName(place)
                            .source("USGS")
                            .externalId(feature.get("id").toString())
                            .eventTime(LocalDateTime.ofInstant(
                                    Instant.ofEpochMilli(timeMs), ZoneId.systemDefault()))
                            .status(AlertStatus.PENDING)
                            .metadata("magnitude: " + magnitude)
                            .createdAt(LocalDateTime.now())
                            .build();

                    events.add(event);
                } catch (Exception e) {
                    log.warn("Skipping malformed USGS feature: {}", e.getMessage());
                }
            }

            log.info("Fetched {} earthquake events from USGS", events.size());

        } catch (Exception e) {
            log.error("Failed to fetch earthquakes from USGS: {}", e.getMessage());
        }

        return events;
    }
}
