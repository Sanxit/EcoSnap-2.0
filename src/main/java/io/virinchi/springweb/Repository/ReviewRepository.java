package io.virinchi.springweb.repository;

import io.virinchi.springweb.domain.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByPhotographerIdOrderByCreatedAtDesc(Long photographerId);
    List<Review> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
    java.util.Optional<Review> findByBookingId(Long bookingId);
}
