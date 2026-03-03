package io.reflectoring.demo.service;

import io.reflectoring.demo.entity.AuditLog;
import io.reflectoring.demo.entity.AuditStatus;
import io.reflectoring.demo.repository.AuditLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public void log(String action, String email, String details, AuditStatus status, HttpServletRequest request) {
        AuditLog auditLog = AuditLog.builder()
                .action(action)
                .email(email)
                .details(details)
                .status(status)
                .ipAddress(request.getRemoteAddr())
                .timestamp(LocalDateTime.now())
                .build();
        auditLogRepository.save(auditLog);
    }
}
