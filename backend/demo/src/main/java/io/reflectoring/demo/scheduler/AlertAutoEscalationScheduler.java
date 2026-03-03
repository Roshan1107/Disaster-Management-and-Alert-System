package io.reflectoring.demo.scheduler;

import io.reflectoring.demo.dto.DisasterEventDTO;
import io.reflectoring.demo.entity.AlertStatus;
import io.reflectoring.demo.entity.DisasterEvent;
import io.reflectoring.demo.repository.DisasterEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Checks every 30 seconds for PENDING_VERIFICATION alerts older than 5 minutes.
 * Auto-escalates them to AUTO_ESCALATED and notifies responders.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AlertAutoEscalationScheduler {

    private static final int ESCALATION_TIMEOUT_MINUTES = 5;

    private final DisasterEventRepository disasterEventRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Scheduled(fixedRate = 30000) // every 30 seconds
    public void escalateStaleAlerts() {
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(ESCALATION_TIMEOUT_MINUTES);

        List<DisasterEvent> staleAlerts = disasterEventRepository
                .findByStatusAndPendingSinceBefore(AlertStatus.PENDING_VERIFICATION, cutoff);

        if (staleAlerts.isEmpty()) {
            return;
        }

        log.info("Found {} stale PENDING_VERIFICATION alerts to auto-escalate", staleAlerts.size());

        for (DisasterEvent event : staleAlerts) {
            event.setStatus(AlertStatus.AUTO_ESCALATED);
            DisasterEvent saved = disasterEventRepository.save(event);

            DisasterEventDTO dto = DisasterEventDTO.from(saved);
            messagingTemplate.convertAndSend("/topic/responder-alerts", dto);

            log.info("Auto-escalated event {} '{}' (severity: {}) → sent to responders",
                    saved.getId(), saved.getTitle(), saved.getSeverity());
        }
    }
}
