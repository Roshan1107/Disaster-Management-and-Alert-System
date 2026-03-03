package io.reflectoring.demo.repository;

import io.reflectoring.demo.entity.Profile;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ProfileRepository extends JpaRepository<Profile, Long> {
    Optional<Profile> findByUserId(Long userId);

    List<Profile> findByRegion(String region);
}
