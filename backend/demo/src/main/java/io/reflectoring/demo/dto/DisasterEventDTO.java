package io.reflectoring.demo.dto;

import io.reflectoring.demo.entity.DisasterEvent;
import io.reflectoring.demo.entity.SeverityLevel;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class DisasterEventDTO {
    private Long id;
    private String title;
    private String description;
    private String disasterType;
    private SeverityLevel severity;
    private String region;
    private String locationName;
    private Double latitude;
    private Double longitude;
    private String status;
    private LocalDateTime eventTime;
    private LocalDateTime createdAt;
    private LocalDateTime pendingSince;

    private String verifiedBy;
    private LocalDateTime verifiedAt;
    private String rejectionReason;

    public static DisasterEventDTO from(DisasterEvent event) {
        DisasterEventDTO dto = new DisasterEventDTO();
        dto.setId(event.getId());
        dto.setTitle(event.getTitle());
        dto.setDescription(event.getDescription());
        dto.setDisasterType(event.getDisasterType().name());
        dto.setSeverity(event.getSeverity());
        dto.setRegion(event.getRegion());
        dto.setLocationName(event.getLocationName());
        dto.setLatitude(event.getLatitude());
        dto.setLongitude(event.getLongitude());
        dto.setStatus(event.getStatus().name());
        dto.setEventTime(event.getEventTime());
        dto.setCreatedAt(event.getCreatedAt());
        dto.setPendingSince(event.getPendingSince());

        if (event.getVerifiedBy() != null) {
            dto.setVerifiedBy(event.getVerifiedBy().getEmail());
        }
        dto.setVerifiedAt(event.getVerifiedAt());
        dto.setRejectionReason(event.getRejectionReason());

        return dto;
    }
}
