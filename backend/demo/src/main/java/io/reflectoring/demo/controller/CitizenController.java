package io.reflectoring.demo.controller;

import io.reflectoring.demo.dto.DisasterEventDTO;
import io.reflectoring.demo.entity.AlertStatus;
import io.reflectoring.demo.repository.DisasterEventRepository;
import io.reflectoring.demo.service.DisasterEventService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/citizen")
@RequiredArgsConstructor
public class CitizenController {

    private final DisasterEventRepository disasterEventRepository;
    private final DisasterEventService disasterEventService;

    /** Get verified/active alerts (public, optionally filtered by region) */
    @GetMapping("/alerts")
    public ResponseEntity<List<DisasterEventDTO>> getAlerts(
            @RequestParam(required = false) String region) {
        List<DisasterEventDTO> alerts;
        if (region != null && !region.isBlank()) {
            alerts = disasterEventRepository
                    .findByStatusIn(List.of(AlertStatus.VERIFIED, AlertStatus.ACTIVE))
                    .stream()
                    .filter(e -> region.equalsIgnoreCase(e.getRegion()))
                    .map(DisasterEventDTO::from)
                    .collect(Collectors.toList());
        } else {
            alerts = disasterEventRepository
                    .findByStatusIn(List.of(AlertStatus.VERIFIED, AlertStatus.ACTIVE))
                    .stream()
                    .map(DisasterEventDTO::from)
                    .collect(Collectors.toList());
        }
        return ResponseEntity.ok(alerts);
    }

    /** Request emergency help */
    @PostMapping("/request-help")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<String> requestHelp(Principal principal) {
        String email = principal != null ? principal.getName() : "anonymous";
        disasterEventService.requestHelp(email);
        return ResponseEntity.ok("Help requested successfully! Responders have been notified.");
    }
}
