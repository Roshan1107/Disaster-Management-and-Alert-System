package io.reflectoring.demo.service;

import io.reflectoring.demo.entity.DisasterEvent;
import io.reflectoring.demo.entity.DisasterType;
import io.reflectoring.demo.entity.SeverityLevel;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class DisasterCategorizationService {

    public DisasterType categorizeByKeywords(String description, String title) {
        String combined = ((description != null ? description : "") + " " + (title != null ? title : "")).toLowerCase();

        if (containsAny(combined, "flood", "rainfall", "river overflow", "inundation", "deluge")) {
            return DisasterType.FLOOD;
        }
        if (containsAny(combined, "cyclone", "hurricane", "typhoon", "wind speed", "tropical storm")) {
            return DisasterType.CYCLONE;
        }
        if (containsAny(combined, "earthquake", "seismic", "tremor", "magnitude", "quake")) {
            return DisasterType.EARTHQUAKE;
        }
        if (containsAny(combined, "fire", "wildfire", "blaze", "conflagration", "burning")) {
            return DisasterType.WILDFIRE;
        }
        if (containsAny(combined, "landslide", "mudslide", "rockslide", "debris flow")) {
            return DisasterType.LANDSLIDE;
        }
        if (containsAny(combined, "tsunami", "tidal wave", "seismic sea wave")) {
            return DisasterType.TSUNAMI;
        }
        if (containsAny(combined, "drought", "water shortage", "arid", "dry spell")) {
            return DisasterType.DROUGHT;
        }
        if (containsAny(combined, "heatwave", "heat wave", "extreme heat", "high temperature")) {
            return DisasterType.HEATWAVE;
        }
        if (containsAny(combined, "storm", "thunderstorm", "severe weather")) {
            return DisasterType.STORM;
        }
        if (containsAny(combined, "tornado", "twister", "funnel cloud")) {
            return DisasterType.TORNADO;
        }
        if (containsAny(combined, "volcano", "volcanic", "eruption", "lava", "ash cloud")) {
            return DisasterType.VOLCANIC_ERUPTION;
        }
        return DisasterType.OTHER;
    }

    public SeverityLevel assignSeverityLevel(DisasterEvent event) {
        DisasterType type = event.getDisasterType();
        String metadata = event.getMetadata() != null ? event.getMetadata() : "";
        String description = event.getDescription() != null ? event.getDescription().toLowerCase() : "";

        switch (type) {
            case EARTHQUAKE:
                return assignEarthquakeSeverityLevel(metadata);
            case CYCLONE:
                return assignCycloneSeverityLevel(description, metadata);
            case FLOOD:
                return assignFloodSeverityLevel(description);
            case FIRE:
            case WILDFIRE:
                return assignFireSeverityLevel(description);
            default:
                return inferSeverityLevelFromKeywords(description);
        }
    }

    private SeverityLevel assignEarthquakeSeverityLevel(String metadata) {
        try {
            if (metadata.contains("magnitude")) {
                String magStr = metadata.replaceAll("[^0-9.]", "");
                if (!magStr.isEmpty()) {
                    double magnitude = Double.parseDouble(magStr);
                    if (magnitude >= 7.0)
                        return SeverityLevel.CRITICAL;
                    if (magnitude >= 6.0)
                        return SeverityLevel.HIGH;
                    if (magnitude >= 4.0)
                        return SeverityLevel.MEDIUM;
                    return SeverityLevel.LOW;
                }
            }
        } catch (Exception e) {
            log.warn("Could not parse earthquake magnitude from metadata: {}", metadata);
        }
        return SeverityLevel.MEDIUM;
    }

    private SeverityLevel assignCycloneSeverityLevel(String description, String metadata) {
        if (containsAny(description, "extreme", "category 5", "category 4", "super cyclone")) {
            return SeverityLevel.CRITICAL;
        }
        if (containsAny(description, "severe", "category 3", "very severe")) {
            return SeverityLevel.HIGH;
        }
        if (containsAny(description, "moderate", "category 2", "category 1")) {
            return SeverityLevel.MEDIUM;
        }
        return SeverityLevel.LOW;
    }

    private SeverityLevel assignFloodSeverityLevel(String description) {
        if (containsAny(description, "severe", "extreme", "catastrophic", "major flooding")) {
            return SeverityLevel.CRITICAL;
        }
        if (containsAny(description, "moderate", "significant", "warning")) {
            return SeverityLevel.HIGH;
        }
        if (containsAny(description, "minor", "watch")) {
            return SeverityLevel.MEDIUM;
        }
        return SeverityLevel.LOW;
    }

    private SeverityLevel assignFireSeverityLevel(String description) {
        if (containsAny(description, "out of control", "extreme", "large area", "evacuation")) {
            return SeverityLevel.CRITICAL;
        }
        if (containsAny(description, "spreading", "significant", "multiple structures")) {
            return SeverityLevel.HIGH;
        }
        if (containsAny(description, "contained", "small", "controlled")) {
            return SeverityLevel.LOW;
        }
        return SeverityLevel.MEDIUM;
    }

    private SeverityLevel inferSeverityLevelFromKeywords(String description) {
        if (containsAny(description, "critical", "extreme", "catastrophic", "severe", "emergency")) {
            return SeverityLevel.CRITICAL;
        }
        if (containsAny(description, "high", "significant", "major", "warning")) {
            return SeverityLevel.HIGH;
        }
        if (containsAny(description, "moderate", "medium", "watch")) {
            return SeverityLevel.MEDIUM;
        }
        return SeverityLevel.LOW;
    }

    private boolean containsAny(String text, String... keywords) {
        for (String keyword : keywords) {
            if (text.contains(keyword)) {
                return true;
            }
        }
        return false;
    }
}
