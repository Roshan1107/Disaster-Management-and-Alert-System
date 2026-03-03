package io.reflectoring.demo.scheduler;

import io.reflectoring.demo.client.OpenWeatherMapClient;
import io.reflectoring.demo.client.UsgsEarthquakeClient;
import io.reflectoring.demo.entity.AlertStatus;
import io.reflectoring.demo.entity.DisasterEvent;
import io.reflectoring.demo.entity.DisasterType;
import io.reflectoring.demo.entity.SeverityLevel;
import io.reflectoring.demo.repository.DisasterEventRepository;
import io.reflectoring.demo.service.DisasterCategorizationService;
import io.reflectoring.demo.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DisasterApiSchedulerTest {

    @Mock
    private UsgsEarthquakeClient usgsClient;

    @Mock
    private OpenWeatherMapClient weatherClient;

    @Mock
    private DisasterEventRepository repository;

    @Mock
    private DisasterCategorizationService categorizationService;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @Mock
    private NotificationService notificationService;

    private DisasterApiScheduler scheduler;

    @BeforeEach
    void setUp() {
        scheduler = new DisasterApiScheduler(usgsClient, weatherClient, repository,
                categorizationService, messagingTemplate, notificationService);
    }

    @Test
    @DisplayName("fetchAndStoreEvents should fetch from clients and save new events")
    void testFetchAndStore_savesNewEvents() {
        // Mock USGS event (will be categorized as MEDIUM → PENDING_VERIFICATION)
        DisasterEvent earthquake = DisasterEvent.builder()
                .externalId("usgs-123")
                .title("Earthquake M5.0")
                .disasterType(DisasterType.EARTHQUAKE)
                .description("Minor earthquake")
                .build();
        when(usgsClient.fetchEarthquakes()).thenReturn(List.of(earthquake));

        // Mock Weather event (will be categorized as HIGH → PENDING_VERIFICATION)
        DisasterEvent weather = DisasterEvent.builder()
                .externalId("weather-456")
                .title("Severe Storm")
                .disasterType(DisasterType.STORM)
                .description("Severe storm warning")
                .build();
        when(weatherClient.fetchWeatherAlerts()).thenReturn(List.of(weather));

        // Mock repository behavior (not existing)
        when(repository.findByExternalId("usgs-123")).thenReturn(Optional.empty());
        when(repository.findByExternalId("weather-456")).thenReturn(Optional.empty());

        // Mock categorization — non-critical
        when(categorizationService.assignSeverityLevel(earthquake)).thenReturn(SeverityLevel.MEDIUM);
        when(categorizationService.assignSeverityLevel(weather)).thenReturn(SeverityLevel.HIGH);

        // Run
        scheduler.fetchAndStoreEvents();

        // Verify save calls
        verify(repository, times(1)).save(earthquake);
        verify(repository, times(1)).save(weather);

        // Verify categorization was called
        verify(categorizationService).assignSeverityLevel(earthquake);
        verify(categorizationService).assignSeverityLevel(weather);

        // Non-critical events should NOT be broadcast to citizens
        verify(messagingTemplate, never()).convertAndSend(eq("/topic/alerts"), (Object) any());
    }

    @Test
    @DisplayName("CRITICAL events should be auto-broadcast to citizens")
    void testFetchAndStore_criticalEventsBroadcast() {
        DisasterEvent criticalEvent = DisasterEvent.builder()
                .externalId("usgs-critical")
                .title("Major Earthquake M7.5")
                .disasterType(DisasterType.EARTHQUAKE)
                .description("Major earthquake")
                .build();
        when(usgsClient.fetchEarthquakes()).thenReturn(List.of(criticalEvent));
        when(weatherClient.fetchWeatherAlerts()).thenReturn(Collections.emptyList());
        when(repository.findByExternalId("usgs-critical")).thenReturn(Optional.empty());
        when(categorizationService.assignSeverityLevel(criticalEvent)).thenReturn(SeverityLevel.CRITICAL);
        when(repository.save(criticalEvent)).thenReturn(criticalEvent);

        scheduler.fetchAndStoreEvents();

        // CRITICAL events should be saved with ACTIVE status and broadcast
        verify(repository).save(criticalEvent);
        verify(messagingTemplate).convertAndSend(eq("/topic/alerts"), (Object) any());
        verify(notificationService).sendAlertNotification(criticalEvent);
    }

    @Test
    @DisplayName("fetchAndStoreEvents should skip existing events")
    void testFetchAndStore_skipsExisting() {
        DisasterEvent earthquake = DisasterEvent.builder().externalId("usgs-123").build();
        when(usgsClient.fetchEarthquakes()).thenReturn(List.of(earthquake));
        when(weatherClient.fetchWeatherAlerts()).thenReturn(Collections.emptyList());

        // Existing event in DB
        when(repository.findByExternalId("usgs-123")).thenReturn(Optional.of(earthquake));

        scheduler.fetchAndStoreEvents();

        // Verify save NOT called
        verify(repository, never()).save(any(DisasterEvent.class));
    }
}
