package io.reflectoring.demo.repository.specification;

import io.reflectoring.demo.entity.AlertStatus;
import io.reflectoring.demo.entity.DisasterEvent;
import io.reflectoring.demo.entity.DisasterType;
import io.reflectoring.demo.entity.SeverityLevel;
import org.springframework.data.jpa.domain.Specification;

public class DisasterEventSpecification {

    public static Specification<DisasterEvent> hasStatus(AlertStatus status) {
        return (root, query, cb) -> cb.equal(root.get("status"), status);
    }

    public static Specification<DisasterEvent> hasType(DisasterType type) {
        return (root, query, cb) -> cb.equal(root.get("disasterType"), type);
    }

    public static Specification<DisasterEvent> hasSeverityLevel(SeverityLevel severity) {
        return (root, query, cb) -> cb.equal(root.get("severity"), severity);
    }

    public static Specification<DisasterEvent> locationSimilarTo(String location) {
        return (root, query, cb) -> cb.like(cb.lower(root.get("locationName")), "%" + location.toLowerCase() + "%");
    }

    public static Specification<DisasterEvent> regionSimilarTo(String region) {
        return (root, query, cb) -> cb.like(cb.lower(root.get("region")), "%" + region.toLowerCase() + "%");
    }
}
