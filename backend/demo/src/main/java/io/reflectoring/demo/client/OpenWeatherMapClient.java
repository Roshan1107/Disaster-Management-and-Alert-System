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

/**
 * Fetches weather alerts from OpenWeatherMap One Call API.
 * Gracefully returns empty list if API key is not configured.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OpenWeatherMapClient {

    private final WebClient webClient;
    private final ExternalApiConfig config;

    public List<DisasterEvent> fetchWeatherAlerts() {
        if (config.getOpenWeatherKey() == null || config.getOpenWeatherKey().isBlank()) {
            log.warn("OpenWeatherMap API key not configured – skipping weather alert fetch");
            return new ArrayList<>();
        }

        log.info("Fetching weather alerts from OpenWeatherMap");
        List<DisasterEvent> events = new ArrayList<>();

        try {
            // One Call API 2.5 – fetch for a central location (configurable lat/lon)
            String url = String.format(
                    "https://api.openweathermap.org/data/2.5/onecall?lat=%s&lon=%s&exclude=current,minutely,hourly,daily&appid=%s",
                    config.getOpenWeatherLat(),
                    config.getOpenWeatherLon(),
                    config.getOpenWeatherKey());

            @SuppressWarnings("unchecked")
            Map<String, Object> response = webClient.get()
                    .uri(url)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response == null || !response.containsKey("alerts")) {
                log.info("No weather alerts returned from OpenWeatherMap");
                return events;
            }

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> alerts = (List<Map<String, Object>>) response.get("alerts");

            for (Map<String, Object> alert : alerts) {
                String senderName = getString(alert, "sender_name", "OpenWeatherMap");
                String eventName = getString(alert, "event", "Weather Alert");
                String description = getString(alert, "description", "");
                long startEpoch = getLong(alert, "start");
                long endEpoch = getLong(alert, "end");

                LocalDateTime eventTime = startEpoch > 0
                        ? LocalDateTime.ofInstant(Instant.ofEpochSecond(startEpoch), ZoneId.systemDefault())
                        : LocalDateTime.now();

                // Build a unique external ID from sender + event + start time
                String externalId = "OWM-" + senderName.replaceAll("\\s+", "_") + "-" + startEpoch;

                DisasterEvent event = DisasterEvent.builder()
                        .title(eventName)
                        .description(description.length() > 500 ? description.substring(0, 500) : description)
                        .disasterType(DisasterType.OTHER) // will be overridden by categorization service
                        .severity(SeverityLevel.MEDIUM) // will be overridden by categorization service
                        .source("OpenWeatherMap")
                        .externalId(externalId)
                        .locationName(senderName)
                        .eventTime(eventTime)
                        .status(AlertStatus.PENDING)
                        .metadata("end_epoch: " + endEpoch)
                        .createdAt(LocalDateTime.now())
                        .build();

                events.add(event);
            }

            log.info("Fetched {} weather alerts from OpenWeatherMap", events.size());

        } catch (Exception e) {
            log.error("Failed to fetch weather alerts from OpenWeatherMap: {}", e.getMessage());
        }

        return events;
    }

    private String getString(Map<String, Object> map, String key, String defaultValue) {
        Object val = map.get(key);
        return val != null ? val.toString() : defaultValue;
    }

    private long getLong(Map<String, Object> map, String key) {
        Object val = map.get(key);
        if (val instanceof Number)
            return ((Number) val).longValue();
        return 0L;
    }
}
