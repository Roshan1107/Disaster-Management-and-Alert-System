package io.reflectoring.demo.service;

import io.reflectoring.demo.entity.Profile;
import io.reflectoring.demo.repository.ProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final ProfileRepository profileRepository;

    public Optional<Profile> getProfileByUserId(Long userId) {
        return profileRepository.findByUserId(userId);
    }

    public Profile saveProfile(Profile profile) {
        return profileRepository.save(profile);
    }
}
