package io.reflectoring.demo.controller;

import io.reflectoring.demo.dto.DisasterEventDTO;
import io.reflectoring.demo.entity.*;
import io.reflectoring.demo.repository.RescueTaskRepository;
import io.reflectoring.demo.repository.UserRepository;
import io.reflectoring.demo.service.DisasterEventService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/responder")
@RequiredArgsConstructor
@PreAuthorize("hasRole('RESPONDER') or hasRole('ADMIN')")
public class ResponderController {

    private final RescueTaskRepository rescueTaskRepository;
    private final UserRepository userRepository;
    private final DisasterEventService disasterEventService;

    /** Get tasks assigned to the logged-in responder */
    @GetMapping("/tasks")
    public ResponseEntity<List<AdminController.RescueTaskDTO>> getMyTasks(Principal principal) {
        String email = principal != null ? principal.getName() : null;
        if (email == null)
            return ResponseEntity.ok(List.of());

        return userRepository.findByEmail(email).map(user -> {
            List<RescueTask> tasks = rescueTaskRepository.findByResponderId(user.getId());
            return ResponseEntity.ok(
                    tasks.stream().map(AdminController.RescueTaskDTO::from).collect(Collectors.toList()));
        }).orElse(ResponseEntity.ok(List.of()));
    }

    /** Update status of a task */
    @PatchMapping("/tasks/{taskId}/status")
    public ResponseEntity<AdminController.RescueTaskDTO> updateTaskStatus(
            @PathVariable Long taskId,
            @RequestParam String status) {
        TaskStatus taskStatus = TaskStatus.valueOf(status.toUpperCase());
        RescueTask updated = disasterEventService.updateTaskStatus(taskId, taskStatus);
        return ResponseEntity.ok(AdminController.RescueTaskDTO.from(updated));
    }

    /** Get alerts pending responder review (SENT_TO_RESPONDER or AUTO_ESCALATED) */
    @GetMapping("/alerts")
    public ResponseEntity<List<DisasterEventDTO>> getResponderAlerts() {
        List<DisasterEventDTO> alerts = disasterEventService.getResponderAlerts()
                .stream().map(DisasterEventDTO::from).collect(Collectors.toList());
        return ResponseEntity.ok(alerts);
    }

    /** Forward an alert to citizens (sets status to ACTIVE, broadcasts) */
    @PutMapping("/alerts/{id}/forward")
    public ResponseEntity<DisasterEventDTO> forwardToCitizen(@PathVariable Long id) {
        return ResponseEntity.ok(disasterEventService.forwardToCitizen(id));
    }
}
