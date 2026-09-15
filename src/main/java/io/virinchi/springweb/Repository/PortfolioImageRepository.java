package io.virinchi.springweb.repository;

import io.virinchi.springweb.domain.PortfolioImage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PortfolioImageRepository extends JpaRepository<PortfolioImage, Long> {
    List<PortfolioImage> findByProfileIdOrderBySortOrderAsc(Long profileId);
}
