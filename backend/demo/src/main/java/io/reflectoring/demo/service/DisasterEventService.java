package io.reflectoring.demo.service;

import io.reflectoring.demo.dto.DisasterEventRequest;
import io.reflectoring.demo.dto.DisasterEventDTO;
import io.reflectoring.demo.entity.*;
import io.reflectoring.demo.repository.DisasterEventRepository;
import io.reflectoring.demo.repository.ProfileRepository;
import io.reflectoring.demo.repository.RescueTaskRepository;
import io.reflectoring.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DisasterEventService {

    private static final Logger log = LoggerFactory.getLogger(DisasterEventService.class);
    private final DisasterEventRepository disasterEventRepository;
    private final UserRepository userRepository;
    private final RescueTaskRepository rescueTaskRepository;
    private final ProfileRepository profileRepository;
    private final AuditService auditService;
    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationService notificationService;

    public List<DisasterEvent> getPendingEvents() {
        return disasterEventRepository.findByStatus(AlertStatus.PENDING_VERIFICATION);
    }

    public List<DisasterEvent> getAllEvents() {
        return disasterEventRepository.findAll();
    }

    @Cacheable("verifiedAlerts")
    public List<DisasterEvent> getPublicEvents() {
        log.debug("Loading verified alerts from DB (cache miss)");
        return disasterEventRepository.findByStatusIn(List.of(AlertStatus.VERIFIED, AlertStatus.ACTIVE));
    }

    public List<DisasterEvent> getAlertsByRegion(String region) {
        return disasterEventRepository.findByRegion(region);
    }

    /**
     * Get alerts that are ready for responder review.
     * Returns events with status SENT_TO_RESPONDER or AUTO_ESCALATED.
     */
    public List<DisasterEvent> getResponderAlerts() {
        return disasterEventRepository.findByStatusIn(
                List.of(AlertStatus.SENT_TO_RESPONDER, AlertStatus.AUTO_ESCALATED));
    }

    /**
     * Admin approves an alert → status becomes SENT_TO_RESPONDER.
     * The alert is forwarded to responders via WebSocket for their review
     * before being broadcast to citizens.
     */
    @CacheEvict(value = "verifiedAlerts", allEntries = true)
    public DisasterEventDTO approveEvent(Long id, String adminEmail, jakarta.servlet.http.HttpServletRequest request) {
        DisasterEvent event = disasterEventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found: " + id));

        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new RuntimeException("Admin not found: " + adminEmail));

        event.setStatus(AlertStatus.SENT_TO_RESPONDER);
        event.setVerifiedBy(admin);
        event.setVerifiedAt(LocalDateTime.now());

        auditService.log("APPROVE_ALERT", adminEmail, "Approved event ID: " + id, AuditStatus.SUCCESS, request);
        log.info("Event {} approved by admin {} → sent to responder", id, adminEmail);

        DisasterEvent savedEvent = disasterEventRepository.save(event);
        DisasterEventDTO dto = DisasterEventDTO.from(savedEvent);

        // Notify responders via WebSocket
        messagingTemplate.convertAndSend("/topic/responder-alerts", dto);
        log.info("Event {} forwarded to responders via /topic/responder-alerts", id);

        return dto;
    }

    /**
     * Responder forwards a verified/escalated alert to citizens.
     * Sets status to ACTIVE, broadcasts to /topic/alerts, and sends notifications.
     */
    @CacheEvict(value = "verifiedAlerts", allEntries = true)
    public DisasterEventDTO forwardToCitizen(Long id) {
        DisasterEvent event = disasterEventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found: " + id));

        if (event.getStatus() != AlertStatus.SENT_TO_RESPONDER
                && event.getStatus() != AlertStatus.AUTO_ESCALATED) {
            throw new RuntimeException("Alert is not in a forwardable state. Current status: " + event.getStatus());
        }

        event.setStatus(AlertStatus.ACTIVE);

        DisasterEvent savedEvent = disasterEventRepository.save(event);
        DisasterEventDTO dto = DisasterEventDTO.from(savedEvent);

        // Broadcast to all citizens via WebSocket
        messagingTemplate.convertAndSend("/topic/alerts", dto);
        log.info("Event {} forwarded to citizens by responder → status ACTIVE", id);

        // Send notifications (Email/SMS)
        notificationService.sendAlertNotification(savedEvent);

        return dto;
    }

    @CacheEvict(value = "verifiedAlerts", allEntries = true)
    public DisasterEventDTO rejectEvent(Long id, String adminEmail, String reason,
            jakarta.servlet.http.HttpServletRequest request) {
        DisasterEvent event = disasterEventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found: " + id));

        event.setStatus(AlertStatus.REJECTED);
        if (reason != null && !reason.isBlank()) {
            event.setRejectionReason(reason);
        }

        auditService.log("REJECT_ALERT", adminEmail, "Rejected event ID: " + id, AuditStatus.SUCCESS, request);
        log.info("Event {} rejected by {}", id, adminEmail);

        return DisasterEventDTO.from(disasterEventRepository.save(event));
    }

    public void requestHelp(String userEmail) {
        userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found: " + userEmail));

        RescueTask task = RescueTask.builder()
                .description("Emergency Help Requested by " + userEmail)
                .status(TaskStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();
        rescueTaskRepository.save(task);
        log.info("Help requested by user: {}", userEmail);
    }

    public List<RescueTask> getTasksForResponder(Long responderId) {
        return rescueTaskRepository.findByResponderId(responderId);
    }

    public RescueTask updateTaskStatus(Long taskId, TaskStatus status) {
        RescueTask task = rescueTaskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found: " + taskId));
        task.setStatus(status);
        return rescueTaskRepository.save(task);
    }

    public RescueTask assignTask(String description, Long responderId, String locationName, Double latitude,
            Double longitude) {
        User responder = userRepository.findById(responderId)
                .orElseThrow(() -> new RuntimeException("Responder not found: " + responderId));

        if (responder.getRole() != Role.RESPONDER) {
            throw new RuntimeException("User is not a responder");
        }

        RescueTask task = RescueTask.builder()
                .description(description)
                .responder(responder)
                .status(TaskStatus.PENDING)
                .locationName(locationName)
                .latitude(latitude)
                .longitude(longitude)
                .createdAt(LocalDateTime.now())
                .build();

        RescueTask savedTask = rescueTaskRepository.save(task);

        // Notify Responder
        notificationService.sendTaskAssignmentNotification(responder.getEmail(), description);

        return savedTask;
    }

    public DisasterEvent createManualAlert(DisasterEventRequest request) {
        log.info("Creating manual disaster alert: {} for region: {}", request.getTitle(), request.getRegion());

        DisasterEvent event = DisasterEvent.builder()
                .title(request.getTitle())
                .description(request.getMessage())
                .region(request.getRegion())
                .disasterType(DisasterType.OTHER)
                .severity(SeverityLevel.MEDIUM)
                .status(AlertStatus.PENDING_VERIFICATION)
                .pendingSince(LocalDateTime.now())
                .source("MANUAL")
                .createdAt(LocalDateTime.now())
                .build();

        DisasterEvent savedEvent = disasterEventRepository.save(event);
        List<Profile> profilesInRegion = profileRepository.findByRegion(request.getRegion());
        log.info("Manual alert {} created for region {}. {} users in region.",
                savedEvent.getId(), request.getRegion(), profilesInRegion.size());

        return savedEvent;
    }
}
