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
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class NasaEonetClient {

    private final WebClient webClient;
    private final ExternalApiConfig config;

    public List<DisasterEvent> fetchDisasterEvents() {
        log.info("Fetching disaster events from NASA EONET");
        Map<String, Object> response = webClient.get()
                .uri(config.getNasaEonetUrl())
                .retrieve()
                .bodyToMono(Map.class)
                .block();

        List<DisasterEvent> events = new ArrayList<>();
        if (response != null && response.containsKey("events")) {
            List<Map<String, Object>> nasaEvents = (List<Map<String, Object>>) response.get("events");
            for (Map<String, Object> nasaEvent : nasaEvents) {
                List<Map<String, Object>> geometries = (List<Map<String, Object>>) nasaEvent.get("geometries");
                if (geometries.isEmpty())
                    continue;

                Map<String, Object> geometry = geometries.get(0);
                List<Double> coords = (List<Double>) geometry.get("coordinates");

                DisasterEvent event = DisasterEvent.builder()
                        .title(nasaEvent.get("title").toString())
                        .description(nasaEvent.get("title").toString())
                        .disasterType(DisasterType.OTHER)
                        .severity(SeverityLevel.MEDIUM)
                        .latitude(coords.get(1))
                        .longitude(coords.get(0))
                        .locationName("NASA EONET Location")
                        .source("NASA")
                        .externalId(nasaEvent.get("id").toString())
                        .eventTime(
                                LocalDateTime.parse(geometry.get("date").toString(), DateTimeFormatter.ISO_DATE_TIME))
                        .status(AlertStatus.PENDING)
                        .createdAt(LocalDateTime.now())
                        .build();
                events.add(event);
            }
        }
        return events;
    }
}
