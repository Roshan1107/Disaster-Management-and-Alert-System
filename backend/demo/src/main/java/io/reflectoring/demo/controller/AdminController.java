package io.reflectoring.demo.controller;

import io.reflectoring.demo.dto.DisasterEventDTO;
import io.reflectoring.demo.entity.*;
import io.reflectoring.demo.repository.DisasterEventRepository;
import io.reflectoring.demo.repository.RescueTaskRepository;
import io.reflectoring.demo.repository.UserRepository;
import io.reflectoring.demo.service.DisasterEventService;
import io.reflectoring.demo.service.NotificationService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private static final Logger log = LoggerFactory.getLogger(AdminController.class);

    private final DisasterEventService disasterEventService;
    private final DisasterEventRepository disasterEventRepository;
    private final RescueTaskRepository rescueTaskRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationService notificationService;

    /**
     * Create a manual disaster alert.
     * CRITICAL alerts are auto-broadcast to citizens immediately (status = ACTIVE).
     * Non-critical alerts go to admin verification queue (status =
     * PENDING_VERIFICATION).
     */
    @PostMapping("/alerts")
    public ResponseEntity<DisasterEventDTO> createAlert(@RequestBody CreateAlertRequest req) {
        SeverityLevel severity = SeverityLevel.valueOf(req.getSeverity().toUpperCase());
        boolean isCritical = severity == SeverityLevel.CRITICAL;

        DisasterEvent event = DisasterEvent.builder()
                .title(req.getTitle())
                .description(req.getDescription())
                .disasterType(DisasterType.valueOf(req.getDisasterType().toUpperCase()))
                .severity(severity)
                .region(req.getRegion())
                .locationName(req.getLocationName())
                .source("MANUAL")
                .status(isCritical ? AlertStatus.ACTIVE : AlertStatus.PENDING_VERIFICATION)
                .pendingSince(isCritical ? null : LocalDateTime.now())
                .eventTime(LocalDateTime.now())
                .build();

        DisasterEvent saved = disasterEventRepository.save(event);
        DisasterEventDTO dto = DisasterEventDTO.from(saved);

        if (isCritical) {
            // Auto-broadcast CRITICAL alerts to all citizens via WebSocket + notifications
            messagingTemplate.convertAndSend("/topic/alerts", dto);
            notificationService.sendAlertNotification(saved);
            log.info("CRITICAL alert '{}' auto-broadcast to citizens", saved.getTitle());
        } else {
            log.info("Alert '{}' (severity: {}) → PENDING_VERIFICATION for admin review",
                    saved.getTitle(), severity);
        }

        return ResponseEntity.ok(dto);
    }

    /** Get all alerts (any status) */
    @GetMapping("/alerts")
    public ResponseEntity<List<DisasterEventDTO>> getAllAlerts() {
        return ResponseEntity.ok(
                disasterEventService.getAllEvents().stream()
                        .map(DisasterEventDTO::from)
                        .collect(Collectors.toList()));
    }

    /** Get pending alerts */
    @GetMapping("/alerts/pending")
    public ResponseEntity<List<DisasterEventDTO>> getPendingAlerts() {
        return ResponseEntity.ok(
                disasterEventService.getPendingEvents().stream()
                        .map(DisasterEventDTO::from)
                        .collect(Collectors.toList()));
    }

    /** Approve alert */
    @PutMapping("/alerts/{id}/approve")
    public ResponseEntity<DisasterEventDTO> approveAlert(
            @PathVariable Long id,
            jakarta.servlet.http.HttpServletRequest request,
            java.security.Principal principal) {
        String adminEmail = principal != null ? principal.getName() : "admin";
        return ResponseEntity.ok(disasterEventService.approveEvent(id, adminEmail, request));
    }

    /** Reject alert */
    @PutMapping("/alerts/{id}/reject")
    public ResponseEntity<DisasterEventDTO> rejectAlert(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            jakarta.servlet.http.HttpServletRequest request,
            java.security.Principal principal) {
        String adminEmail = principal != null ? principal.getName() : "admin";
        String reason = body != null ? body.get("reason") : null;
        return ResponseEntity.ok(disasterEventService.rejectEvent(id, adminEmail, reason, request));
    }

    // ─── Rescue Tasks ────────────────────────────────────────────────────────

    /** Get all rescue tasks */
    @GetMapping("/tasks")
    public ResponseEntity<List<RescueTaskDTO>> getAllTasks() {
        return ResponseEntity.ok(
                rescueTaskRepository.findAll().stream()
                        .map(RescueTaskDTO::from)
                        .collect(Collectors.toList()));
    }

    /** Assign a rescue task to a responder */
    @PostMapping("/tasks")
    public ResponseEntity<RescueTaskDTO> assignTask(@RequestBody AssignTaskRequest req) {
        RescueTask task = disasterEventService.assignTask(req.getDescription(), req.getResponderId(),
                req.getLocationName(), req.getLatitude(), req.getLongitude());
        return ResponseEntity.ok(RescueTaskDTO.from(task));
    }

    // ─── Responders ──────────────────────────────────────────────────────────

    /** Get all responders */
    @GetMapping("/responders")
    public ResponseEntity<List<UserDTO>> getAllResponders() {
        return ResponseEntity.ok(
                userRepository.findAll().stream()
                        .filter(u -> u.getRole() == Role.RESPONDER)
                        .map(UserDTO::from)
                        .collect(Collectors.toList()));
    }

    /** Get all users */
    @GetMapping("/users")
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        return ResponseEntity.ok(
                userRepository.findAll().stream()
                        .map(UserDTO::from)
                        .collect(Collectors.toList()));
    }

    // ─── DTOs ────────────────────────────────────────────────────────────────

    @Data
    public static class CreateAlertRequest {
        private String title;
        private String description;
        private String disasterType;
        private String severity;
        private String region;
        private String locationName;
    }

    @Data
    public static class AssignTaskRequest {
        private String description;
        private Long responderId;
        private String locationName;
        private Double latitude;
        private Double longitude;
    }

    @Data
    public static class RescueTaskDTO {
        private Long id;
        private String description;
        private String status;
        private String responderEmail;
        private Long responderId;
        private String createdAt;
        private String locationName;
        private Double latitude;
        private Double longitude;

        public static RescueTaskDTO from(RescueTask t) {
            RescueTaskDTO dto = new RescueTaskDTO();
            dto.id = t.getId();
            dto.description = t.getDescription();
            dto.status = t.getStatus().name();
            dto.createdAt = t.getCreatedAt() != null ? t.getCreatedAt().toString() : null;
            if (t.getResponder() != null) {
                dto.responderEmail = t.getResponder().getEmail();
                dto.responderId = t.getResponder().getId();
            }
            dto.locationName = t.getLocationName();
            dto.latitude = t.getLatitude();
            dto.longitude = t.getLongitude();
            return dto;
        }
    }

    @Data
    public static class UserDTO {
        private Long id;
        private String email;
        private String role;

        public static UserDTO from(User u) {
            UserDTO dto = new UserDTO();
            dto.id = u.getId();
            dto.email = u.getEmail();
            dto.role = u.getRole().name();
            return dto;
        }
    }
}
