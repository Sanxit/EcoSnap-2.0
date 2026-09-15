package io.virinchi.springweb.repository;

import io.virinchi.springweb.domain.AvailabilitySlot;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AvailabilitySlotRepository extends JpaRepository<AvailabilitySlot, Long> {
    List<AvailabilitySlot> findByProfileIdOrderByDateAsc(Long profileId);
    Optional<AvailabilitySlot> findByProfileIdAndDateAndTimeSlot(Long profileId, LocalDate date, io.virinchi.springweb.domain.TimeSlot timeSlot);
}
