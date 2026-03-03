package io.reflectoring.demo.scheduler;

import io.reflectoring.demo.client.OpenWeatherMapClient;
import io.reflectoring.demo.client.UsgsEarthquakeClient;
import io.reflectoring.demo.dto.DisasterEventDTO;
import io.reflectoring.demo.entity.AlertStatus;
import io.reflectoring.demo.entity.DisasterEvent;
import io.reflectoring.demo.entity.SeverityLevel;
import io.reflectoring.demo.repository.DisasterEventRepository;
import io.reflectoring.demo.service.DisasterCategorizationService;
import io.reflectoring.demo.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class DisasterApiScheduler {

    private final UsgsEarthquakeClient usgsClient;
    private final OpenWeatherMapClient weatherClient;
    private final DisasterEventRepository repository;
    private final DisasterCategorizationService categorizationService;
    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationService notificationService;

    @Scheduled(fixedRate = 300000) // 5 minutes
    public void fetchAndStoreEvents() {
        log.info("Starting scheduled disaster data fetch...");

        // 1. Fetch Earthquakes
        try {
            List<DisasterEvent> earthquakes = usgsClient.fetchEarthquakes();
            processEvents(earthquakes);
        } catch (Exception e) {
            log.error("Failed to fetch earthquakes", e);
        }

        // 2. Fetch Weather Alerts
        try {
            List<DisasterEvent> weatherEvents = weatherClient.fetchWeatherAlerts();
            processEvents(weatherEvents);
        } catch (Exception e) {
            log.error("Failed to fetch weather alerts", e);
        }

        log.info("Completed disaster data fetch.");
    }

    private void processEvents(List<DisasterEvent> events) {
        for (DisasterEvent event : events) {
            // Check if exists by external ID
            if (event.getExternalId() != null) {
                Optional<DisasterEvent> existing = repository.findByExternalId(event.getExternalId());
                if (existing.isPresent()) {
                    continue; // Skip if already exists
                }
            }

            // Categorize severity
            event.setSeverity(categorizationService.assignSeverityLevel(event));

            // Route based on severity
            if (event.getSeverity() == SeverityLevel.CRITICAL) {
                // CRITICAL → directly to citizens
                event.setStatus(AlertStatus.ACTIVE);
                DisasterEvent saved = repository.save(event);
                log.info("CRITICAL event '{}' auto-broadcast to citizens (status=ACTIVE)", saved.getTitle());

                // Broadcast to citizens via WebSocket
                DisasterEventDTO dto = DisasterEventDTO.from(saved);
                messagingTemplate.convertAndSend("/topic/alerts", dto);
                notificationService.sendAlertNotification(saved);
            } else {
                // HIGH/MEDIUM/LOW → admin verification queue
                event.setStatus(AlertStatus.PENDING_VERIFICATION);
                event.setPendingSince(LocalDateTime.now());
                repository.save(event);
                log.info("Event '{}' (severity: {}) → PENDING_VERIFICATION for admin review",
                        event.getTitle(), event.getSeverity());
            }
        }
    }
}
