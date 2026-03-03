package io.reflectoring.demo.service;

import io.reflectoring.demo.entity.DisasterEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class NotificationService {

    public void sendAlertNotification(DisasterEvent event) {
        // In a real application, this would integrate with an SMTP server or SMS
        // provider (e.g., Twilio)
        // For now, we log the notification to the console.

        String subject = "🚨 DISASTER ALERT: " + event.getTitle();
        String body = String.format("""
                URGENT ALERT: %s
                Type: %s
                Severity: %s
                Location: %s (%s)

                %s

                Stay safe and follow official instructions.
                """,
                event.getTitle(),
                event.getDisasterType(),
                event.getSeverity(),
                event.getLocationName(),
                event.getRegion(),
                event.getDescription());

        log.info("----------------------------------------------------------------");
        log.info(" [NOTIFICATION SYSTEM] Sending EMAIL/SMS to subscribers in region: {}", event.getRegion());
        log.info(" SUBJECT: {}", subject);
        log.info(" BODY:\n{}", body);
        log.info("----------------------------------------------------------------");
    }

    public void sendTaskAssignmentNotification(String responderEmail, String taskDescription) {
        log.info("----------------------------------------------------------------");
        log.info(" [NOTIFICATION SYSTEM] Sending TASK ASSIGNMENT to: {}", responderEmail);
        log.info(" TASK: {}", taskDescription);
        log.info("----------------------------------------------------------------");
    }
}
