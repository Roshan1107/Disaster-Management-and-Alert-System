package io.reflectoring.demo.controller;

import io.reflectoring.demo.dto.DisasterEventDTO;
import io.reflectoring.demo.entity.DisasterEvent;
import io.reflectoring.demo.service.DisasterEventService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;

import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/disasters")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminDisasterController {

    private final DisasterEventService disasterEventService;

    /** All pending events awaiting admin review */
    @GetMapping("/pending")
    public ResponseEntity<List<DisasterEventDTO>> getPendingAlerts() {
        List<DisasterEventDTO> dtos = disasterEventService.getPendingEvents()
                .stream().map(DisasterEventDTO::from).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    /** All events (any status) for admin dashboard overview */
    @GetMapping("/all")
    public ResponseEntity<List<DisasterEventDTO>> getAllAlerts() {
        List<DisasterEventDTO> dtos = disasterEventService.getAllEvents()
                .stream().map(DisasterEventDTO::from).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    /** Single event detail for admin */
    @GetMapping("/{id}")
    public ResponseEntity<DisasterEventDTO> getAlertById(@PathVariable Long id) {
        return disasterEventService.getAllEvents().stream()
                .filter(e -> e.getId().equals(id))
                .findFirst()
                .map(e -> ResponseEntity.ok(DisasterEventDTO.from(e)))
                .orElse(ResponseEntity.notFound().build());
    }

    /** Approve an alert – broadcasts to WebSocket /topic/alerts */
    @PutMapping("/{id}/approve")
    public ResponseEntity<DisasterEventDTO> approveAlert(
            @PathVariable Long id,
            Principal principal,
            HttpServletRequest request) {
        return ResponseEntity.ok(disasterEventService.approveEvent(id, principal.getName(), request));
    }

    /** Reject an alert with an optional reason */
    @PutMapping("/{id}/reject")
    public ResponseEntity<DisasterEventDTO> rejectAlert(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            Principal principal,
            HttpServletRequest request) {
        String reason = body != null ? body.get("reason") : null;
        return ResponseEntity.ok(disasterEventService.rejectEvent(id, principal.getName(), reason, request));
    }
}
