package io.reflectoring.demo.service;

import io.reflectoring.demo.dto.DisasterEventDTO;
import io.reflectoring.demo.entity.*;
import io.reflectoring.demo.repository.DisasterEventRepository;
import io.reflectoring.demo.repository.ProfileRepository;
import io.reflectoring.demo.repository.RescueTaskRepository;
import io.reflectoring.demo.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for DisasterEventService.
 * Uses manual mock creation (Mockito.mock()) to avoid byte-buddy
 * instrumentation
 * issues with ProfileRepository on Java 21.
 */
class DisasterEventServiceTest {

    private DisasterEventRepository disasterEventRepository;
    private UserRepository userRepository;
    private RescueTaskRepository rescueTaskRepository;
    private ProfileRepository profileRepository;
    private AuditService auditService;
    private SimpMessagingTemplate messagingTemplate;
    private NotificationService notificationService;

    private DisasterEventService service;

    private DisasterEvent pendingEvent;
    private User adminUser;

    @BeforeEach
    void setUp() {
        // Manual mock creation bypasses byte-buddy instrumentation issues on Java 21
        disasterEventRepository = mock(DisasterEventRepository.class);
        userRepository = mock(UserRepository.class);
        rescueTaskRepository = mock(RescueTaskRepository.class);
        profileRepository = mock(ProfileRepository.class);
        auditService = mock(AuditService.class);
        messagingTemplate = mock(SimpMessagingTemplate.class);
        notificationService = mock(NotificationService.class);

        service = new DisasterEventService(
                disasterEventRepository,
                userRepository,
                rescueTaskRepository,
                profileRepository,
                auditService,
                messagingTemplate,
                notificationService);

        adminUser = new User();
        adminUser.setId(1L);
        adminUser.setEmail("admin@test.com");
        adminUser.setRole(Role.ADMIN);

        pendingEvent = DisasterEvent.builder()
                .id(10L)
                .title("Test Earthquake")
                .description("Magnitude 6.5 earthquake near test city")
                .disasterType(DisasterType.EARTHQUAKE)
                .severity(SeverityLevel.HIGH)
                .status(AlertStatus.PENDING)
                .source("USGS")
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("approveEvent should set status to VERIFIED and verifiedBy/verifiedAt")
    void testApproveEvent_setsVerifiedStatus() {
        when(disasterEventRepository.findById(10L)).thenReturn(Optional.of(pendingEvent));
        when(userRepository.findByEmail("admin@test.com")).thenReturn(Optional.of(adminUser));
        when(disasterEventRepository.save(any(DisasterEvent.class))).thenAnswer(inv -> inv.getArgument(0));
        doNothing().when(auditService).log(any(), any(), any(), any(), any());

        DisasterEventDTO result = service.approveEvent(10L, "admin@test.com", null);

        assertEquals(AlertStatus.VERIFIED, pendingEvent.getStatus());
        assertEquals(adminUser, pendingEvent.getVerifiedBy());
        assertNotNull(pendingEvent.getVerifiedAt());
        assertEquals(AlertStatus.VERIFIED, result.getStatus());
        assertEquals("admin@test.com", result.getVerifiedBy());
    }

    @Test
    @DisplayName("approveEvent should broadcast to WebSocket /topic/alerts")
    void testApproveEvent_broadcastsToWebSocket() {
        when(disasterEventRepository.findById(10L)).thenReturn(Optional.of(pendingEvent));
        when(userRepository.findByEmail("admin@test.com")).thenReturn(Optional.of(adminUser));
        when(disasterEventRepository.save(any(DisasterEvent.class))).thenAnswer(inv -> inv.getArgument(0));
        doNothing().when(auditService).log(any(), any(), any(), any(), any());

        service.approveEvent(10L, "admin@test.com", null);

        verify(messagingTemplate, times(1))
                .convertAndSend(eq("/topic/alerts"), any(DisasterEventDTO.class));
    }

    @Test
    @DisplayName("approveEvent should throw when event not found")
    void testApproveEvent_eventNotFound() {
        when(disasterEventRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class,
                () -> service.approveEvent(99L, "admin@test.com", null));
    }

    @Test
    @DisplayName("rejectEvent should set status to REJECTED")
    void testRejectEvent_setsRejectedStatus() {
        when(disasterEventRepository.findById(10L)).thenReturn(Optional.of(pendingEvent));
        when(disasterEventRepository.save(any(DisasterEvent.class))).thenAnswer(inv -> inv.getArgument(0));
        doNothing().when(auditService).log(any(), any(), any(), any(), any());

        DisasterEventDTO result = service.rejectEvent(10L, "admin@test.com", null, null);

        assertEquals(AlertStatus.REJECTED, pendingEvent.getStatus());
        assertEquals(AlertStatus.REJECTED, result.getStatus());
    }

    @Test
    @DisplayName("rejectEvent should store rejection reason when provided")
    void testRejectEvent_storesReason() {
        when(disasterEventRepository.findById(10L)).thenReturn(Optional.of(pendingEvent));
        when(disasterEventRepository.save(any(DisasterEvent.class))).thenAnswer(inv -> inv.getArgument(0));
        doNothing().when(auditService).log(any(), any(), any(), any(), any());

        DisasterEventDTO result = service.rejectEvent(10L, "admin@test.com", "Duplicate event", null);

        assertEquals("Duplicate event", pendingEvent.getRejectionReason());
        assertEquals("Duplicate event", result.getRejectionReason());
    }

    @Test
    @DisplayName("rejectEvent should throw when event not found")
    void testRejectEvent_eventNotFound() {
        when(disasterEventRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class,
                () -> service.rejectEvent(99L, "admin@test.com", null, null));
    }

    @Test
    @DisplayName("requestHelp should create a PENDING rescue task")
    void testRequestHelp_createsRescueTask() {
        User citizen = new User();
        citizen.setEmail("citizen@test.com");
        when(userRepository.findByEmail("citizen@test.com")).thenReturn(Optional.of(citizen));
        when(rescueTaskRepository.save(any(RescueTask.class))).thenAnswer(inv -> inv.getArgument(0));

        service.requestHelp("citizen@test.com");

        verify(rescueTaskRepository, times(1)).save(argThat(task -> task.getStatus() == TaskStatus.PENDING &&
                task.getDescription().contains("citizen@test.com")));
    }
}
