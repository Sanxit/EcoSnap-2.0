package io.virinchi.springweb.domain;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "availability_slots")
public class AvailabilitySlot {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "photographer_profile_id", nullable = false)
    private PhotographerProfile profile;

    @Column(name = "slot_date", nullable = false)
    private LocalDate date;

    @Enumerated(EnumType.STRING)
    @Column(name = "time_slot", nullable = false, length = 30)
    private TimeSlot timeSlot;

    @Column(nullable = false)
    private boolean booked;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public PhotographerProfile getProfile() { return profile; }
    public void setProfile(PhotographerProfile profile) { this.profile = profile; }
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public TimeSlot getTimeSlot() { return timeSlot; }
    public void setTimeSlot(TimeSlot timeSlot) { this.timeSlot = timeSlot; }
    public boolean isBooked() { return booked; }
    public void setBooked(boolean booked) { this.booked = booked; }
}
