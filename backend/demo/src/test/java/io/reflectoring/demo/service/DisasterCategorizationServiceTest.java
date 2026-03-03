package io.reflectoring.demo.service;

import io.reflectoring.demo.entity.AlertStatus;
import io.reflectoring.demo.entity.DisasterEvent;
import io.reflectoring.demo.entity.DisasterType;
import io.reflectoring.demo.entity.SeverityLevel;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for DisasterCategorizationService.
 * Tests keyword-based categorization and severity assignment logic.
 */
class DisasterCategorizationServiceTest {

    private DisasterCategorizationService service;

    @BeforeEach
    void setUp() {
        service = new DisasterCategorizationService();
    }

    // ─── categorizeByKeywords ───────────────────────────────────────────────

    @Test
    @DisplayName("Should categorize FLOOD from description keywords")
    void testCategorizeFlood() {
        assertEquals(DisasterType.FLOOD, service.categorizeByKeywords("severe flood warning", ""));
        assertEquals(DisasterType.FLOOD, service.categorizeByKeywords("river overflow detected", ""));
        assertEquals(DisasterType.FLOOD, service.categorizeByKeywords("", "inundation alert"));
    }

    @Test
    @DisplayName("Should categorize EARTHQUAKE from description keywords")
    void testCategorizeEarthquake() {
        assertEquals(DisasterType.EARTHQUAKE, service.categorizeByKeywords("magnitude 6.5 earthquake", ""));
        assertEquals(DisasterType.EARTHQUAKE, service.categorizeByKeywords("seismic activity detected", ""));
        assertEquals(DisasterType.EARTHQUAKE, service.categorizeByKeywords("", "tremor near city"));
    }

    @Test
    @DisplayName("Should categorize CYCLONE from description keywords")
    void testCategorizeCyclone() {
        assertEquals(DisasterType.CYCLONE, service.categorizeByKeywords("cyclone approaching coast", ""));
        assertEquals(DisasterType.CYCLONE, service.categorizeByKeywords("", "hurricane warning issued"));
        assertEquals(DisasterType.CYCLONE, service.categorizeByKeywords("typhoon landfall expected", ""));
    }

    @Test
    @DisplayName("Should categorize WILDFIRE from description keywords")
    void testCategorizeWildfire() {
        assertEquals(DisasterType.WILDFIRE, service.categorizeByKeywords("wildfire spreading rapidly", ""));
        assertEquals(DisasterType.WILDFIRE, service.categorizeByKeywords("", "blaze out of control"));
    }

    @Test
    @DisplayName("Should categorize TSUNAMI from description keywords")
    void testCategorizeTsunami() {
        assertEquals(DisasterType.TSUNAMI, service.categorizeByKeywords("tsunami warning issued", ""));
        assertEquals(DisasterType.TSUNAMI, service.categorizeByKeywords("tidal wave approaching", ""));
    }

    @Test
    @DisplayName("Should categorize LANDSLIDE from description keywords")
    void testCategorizeLandslide() {
        assertEquals(DisasterType.LANDSLIDE, service.categorizeByKeywords("landslide blocks highway", ""));
        assertEquals(DisasterType.LANDSLIDE, service.categorizeByKeywords("mudslide risk high", ""));
    }

    @Test
    @DisplayName("Should categorize TORNADO from description keywords")
    void testCategorizeTornado() {
        assertEquals(DisasterType.TORNADO, service.categorizeByKeywords("tornado warning in effect", ""));
        assertEquals(DisasterType.TORNADO, service.categorizeByKeywords("", "twister spotted"));
    }

    @Test
    @DisplayName("Should categorize VOLCANIC_ERUPTION from description keywords")
    void testCategorizeVolcano() {
        assertEquals(DisasterType.VOLCANIC_ERUPTION, service.categorizeByKeywords("volcanic eruption imminent", ""));
        assertEquals(DisasterType.VOLCANIC_ERUPTION, service.categorizeByKeywords("lava flow detected", ""));
    }

    @Test
    @DisplayName("Should return OTHER for unrecognized descriptions")
    void testCategorizeOther() {
        assertEquals(DisasterType.OTHER, service.categorizeByKeywords("unknown event", "no keywords"));
        assertEquals(DisasterType.OTHER, service.categorizeByKeywords("", ""));
    }

    // ─── assignSeverityLevel – Earthquake ───────────────────────────────────────

    @Test
    @DisplayName("Earthquake magnitude >= 7.0 should be CRITICAL")
    void testEarthquakeSeverityLevelCritical() {
        DisasterEvent event = buildEarthquakeEvent("magnitude: 7.5");
        assertEquals(SeverityLevel.CRITICAL, service.assignSeverityLevel(event));
    }

    @Test
    @DisplayName("Earthquake magnitude >= 6.0 and < 7.0 should be HIGH")
    void testEarthquakeSeverityLevelHigh() {
        DisasterEvent event = buildEarthquakeEvent("magnitude: 6.2");
        assertEquals(SeverityLevel.HIGH, service.assignSeverityLevel(event));
    }

    @Test
    @DisplayName("Earthquake magnitude >= 4.0 and < 6.0 should be MEDIUM")
    void testEarthquakeSeverityLevelMedium() {
        DisasterEvent event = buildEarthquakeEvent("magnitude: 4.8");
        assertEquals(SeverityLevel.MEDIUM, service.assignSeverityLevel(event));
    }

    @Test
    @DisplayName("Earthquake magnitude < 4.0 should be LOW")
    void testEarthquakeSeverityLevelLow() {
        DisasterEvent event = buildEarthquakeEvent("magnitude: 2.1");
        assertEquals(SeverityLevel.LOW, service.assignSeverityLevel(event));
    }

    @Test
    @DisplayName("Earthquake with no magnitude metadata should default to MEDIUM")
    void testEarthquakeSeverityLevelNoMetadata() {
        DisasterEvent event = buildEarthquakeEvent(null);
        assertEquals(SeverityLevel.MEDIUM, service.assignSeverityLevel(event));
    }

    // ─── assignSeverityLevel – Flood
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("Flood with 'catastrophic' keyword should be CRITICAL")
    void testFloodSeverityLevelCritical() {
        DisasterEvent event = buildEvent(DisasterType.FLOOD, "catastrophic major flooding", null);
        assertEquals(SeverityLevel.CRITICAL, service.assignSeverityLevel(event));
    }

    @Test
    @DisplayName("Flood with 'warning' keyword should be HIGH")
    void testFloodSeverityLevelHigh() {
        DisasterEvent event = buildEvent(DisasterType.FLOOD, "flood warning issued", null);
        assertEquals(SeverityLevel.HIGH, service.assignSeverityLevel(event));
    }

    // ─── assignSeverityLevel – Cyclone
    // ───────────────────────────────────────────

    @Test
    @DisplayName("Cyclone category 5 should be CRITICAL")
    void testCycloneSeverityLevelCritical() {
        DisasterEvent event = buildEvent(DisasterType.CYCLONE, "super cyclone category 5 extreme", null);
        assertEquals(SeverityLevel.CRITICAL, service.assignSeverityLevel(event));
    }

    @Test
    @DisplayName("Cyclone category 3 should be HIGH")
    void testCycloneSeverityLevelHigh() {
        DisasterEvent event = buildEvent(DisasterType.CYCLONE, "severe category 3 cyclone", null);
        assertEquals(SeverityLevel.HIGH, service.assignSeverityLevel(event));
    }

    // ─── Helpers ────────────────────────────────────────────────────────────

    private DisasterEvent buildEarthquakeEvent(String metadata) {
        return DisasterEvent.builder()
                .disasterType(DisasterType.EARTHQUAKE)
                .description("earthquake event")
                .severity(SeverityLevel.MEDIUM)
                .status(AlertStatus.PENDING)
                .metadata(metadata)
                .build();
    }

    private DisasterEvent buildEvent(DisasterType type, String description, String metadata) {
        return DisasterEvent.builder()
                .disasterType(type)
                .description(description)
                .severity(SeverityLevel.MEDIUM)
                .status(AlertStatus.PENDING)
                .metadata(metadata)
                .build();
    }
}
