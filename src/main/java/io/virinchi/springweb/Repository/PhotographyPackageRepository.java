package io.virinchi.springweb.repository;

import io.virinchi.springweb.domain.PhotographyPackage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PhotographyPackageRepository extends JpaRepository<PhotographyPackage, Long> {
    List<PhotographyPackage> findByProfileIdOrderByPriceAsc(Long profileId);
    List<PhotographyPackage> findByProfileIdAndActiveTrueOrderByIdAsc(Long profileId);
}
