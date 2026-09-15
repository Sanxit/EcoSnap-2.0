package io.virinchi.springweb.repository;

import io.virinchi.springweb.domain.PhotographerProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PhotographerProfileRepository extends JpaRepository<PhotographerProfile, Long> {
    Optional<PhotographerProfile> findByUserId(Long userId);
    List<PhotographerProfile> findByVerifiedTrueOrderByIdAsc();
}
