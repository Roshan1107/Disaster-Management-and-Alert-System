package io.reflectoring.demo.controller;

import io.reflectoring.demo.dto.DisasterEventDTO;
import io.reflectoring.demo.entity.AlertStatus;
import io.reflectoring.demo.entity.DisasterEvent;
import io.reflectoring.demo.entity.DisasterType;
import io.reflectoring.demo.entity.SeverityLevel;
import io.reflectoring.demo.repository.DisasterEventRepository;
import io.reflectoring.demo.repository.specification.DisasterEventSpecification;
import io.reflectoring.demo.service.DisasterEventService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/disasters")
@RequiredArgsConstructor
public class DisasterEventController {

    private final DisasterEventRepository disasterEventRepository;
    private final DisasterEventService disasterEventService;

    /** Public endpoint – returns only VERIFIED/ACTIVE alerts as DTOs */
    @GetMapping
    public ResponseEntity<List<DisasterEventDTO>> getPublicAlerts(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String severity,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String region) {

        // Base filter: status must be VERIFIED or ACTIVE (properly grouped)
        Specification<DisasterEvent> statusSpec = Specification.where(
                DisasterEventSpecification.hasStatus(AlertStatus.VERIFIED)
                        .or(DisasterEventSpecification.hasStatus(AlertStatus.ACTIVE)));

        Specification<DisasterEvent> spec = statusSpec;

        if (type != null && !type.isBlank()) {
            try {
                spec = spec.and(DisasterEventSpecification.hasType(DisasterType.valueOf(type.toUpperCase())));
            } catch (IllegalArgumentException ignored) {
            }
        }
        if (severity != null && !severity.isBlank()) {
            try {
                spec = spec.and(
                        DisasterEventSpecification.hasSeverityLevel(SeverityLevel.valueOf(severity.toUpperCase())));
            } catch (IllegalArgumentException ignored) {
            }
        }
        if (location != null && !location.isBlank())
            spec = spec.and(DisasterEventSpecification.locationSimilarTo(location));
        if (region != null && !region.isBlank())
            spec = spec.and(DisasterEventSpecification.regionSimilarTo(region));

        List<DisasterEventDTO> dtos = disasterEventRepository.findAll(spec)
                .stream().map(DisasterEventDTO::from).collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    /** Public endpoint – single alert by ID */
    @GetMapping("/{id}")
    public ResponseEntity<DisasterEventDTO> getAlertById(@PathVariable Long id) {
        return disasterEventRepository.findById(id)
                .map(e -> ResponseEntity.ok(DisasterEventDTO.from(e)))
                .orElse(ResponseEntity.notFound().build());
    }

    /** Authenticated endpoint – request help (creates a rescue task) */
    @PostMapping("/help")
    public ResponseEntity<String> requestHelp(Authentication authentication) {
        disasterEventService.requestHelp(authentication.getName());
        return ResponseEntity.ok("Help requested successfully");
    }
}
