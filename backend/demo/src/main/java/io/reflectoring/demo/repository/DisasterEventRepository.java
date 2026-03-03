package io.reflectoring.demo.repository;

import io.reflectoring.demo.entity.AlertStatus;
import io.reflectoring.demo.entity.DisasterEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface DisasterEventRepository
        extends JpaRepository<DisasterEvent, Long>, JpaSpecificationExecutor<DisasterEvent> {
    List<DisasterEvent> findByStatus(AlertStatus status);

    List<DisasterEvent> findByStatusIn(List<AlertStatus> statuses);

    List<DisasterEvent> findByRegion(String region);

    Optional<DisasterEvent> findByExternalId(String externalId);

    List<DisasterEvent> findByStatusAndPendingSinceBefore(AlertStatus status, LocalDateTime cutoff);
}
