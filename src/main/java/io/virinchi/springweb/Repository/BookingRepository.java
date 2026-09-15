package io.virinchi.springweb.repository;

import io.virinchi.springweb.domain.Booking;
import io.virinchi.springweb.domain.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByCustomerIdOrderByIdDesc(Long customerId);
    List<Booking> findByPhotographerIdOrderByIdDesc(Long photographerId);
    List<Booking> findByPhotographerIdAndStatusOrderByIdDesc(Long photographerId, BookingStatus status);
}
