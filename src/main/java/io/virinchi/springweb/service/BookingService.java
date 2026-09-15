package io.virinchi.springweb.service;

import io.virinchi.springweb.domain.AvailabilitySlot;
import io.virinchi.springweb.domain.Booking;
import io.virinchi.springweb.domain.BookingStatus;
import io.virinchi.springweb.domain.Notification;
import io.virinchi.springweb.domain.NotificationType;
import io.virinchi.springweb.domain.PhotographerProfile;
import io.virinchi.springweb.domain.PhotographyPackage;
import io.virinchi.springweb.domain.User;
import io.virinchi.springweb.dto.ApiDtos.BookingNotesRequest;
import io.virinchi.springweb.dto.ApiDtos.BookingRequest;
import io.virinchi.springweb.dto.ApiDtos.BookingResponse;
import io.virinchi.springweb.dto.ApiDtos.BookingStatusRequest;
import io.virinchi.springweb.dto.ApiDtos.CustomerProfileUpdateRequest;
import io.virinchi.springweb.dto.ApiDtos.UserResponse;
import io.virinchi.springweb.exception.ConflictException;
import io.virinchi.springweb.exception.NotFoundException;
import io.virinchi.springweb.repository.AvailabilitySlotRepository;
import io.virinchi.springweb.repository.BookingRepository;
import io.virinchi.springweb.repository.NotificationRepository;
import io.virinchi.springweb.repository.PhotographerProfileRepository;
import io.virinchi.springweb.repository.PhotographyPackageRepository;
import io.virinchi.springweb.repository.UserRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BookingService {
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final PhotographerProfileRepository profileRepository;
    private final PhotographyPackageRepository packageRepository;
    private final AvailabilitySlotRepository slotRepository;
    private final NotificationRepository notificationRepository;
    private final DtoMapper mapper;

    public BookingService(BookingRepository bookingRepository,
                          UserRepository userRepository,
                          PhotographerProfileRepository profileRepository,
                          PhotographyPackageRepository packageRepository,
                          AvailabilitySlotRepository slotRepository,
                          NotificationRepository notificationRepository,
                          DtoMapper mapper) {
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
        this.packageRepository = packageRepository;
        this.slotRepository = slotRepository;
        this.notificationRepository = notificationRepository;
        this.mapper = mapper;
    }

    @Transactional
    public BookingResponse createBooking(BookingRequest request) {
        User customer = currentUser();
        if (customer.getRole().name().equals("ADMIN")) {
            throw new IllegalArgumentException("Admins cannot create customer bookings through this endpoint");
        }
        PhotographerProfile photographer = profileRepository.findById(request.photographerProfileId())
                .orElseThrow(() -> new NotFoundException("Photographer profile not found"));
        if (request.eventDate() == null || request.eventDate().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Event date must be in the future");
        }
        PhotographyPackage pkg = null;
        if (request.packageId() != null) {
            pkg = packageRepository.findById(request.packageId())
                    .filter(candidate -> candidate.getProfile().getId().equals(photographer.getId()))
                    .orElseThrow(() -> new NotFoundException("Package does not belong to this photographer"));
        }
        if (request.timeSlot() != null) {
            AvailabilitySlot slot = slotRepository
                    .findByProfileIdAndDateAndTimeSlot(photographer.getId(), request.eventDate(), request.timeSlot())
                    .orElse(null);
            if (slot != null && slot.isBooked()) {
                throw new ConflictException("The selected time slot is no longer available");
            }
        }
        Booking booking = new Booking();
        booking.setBookingNumber(createBookingNumber());
        booking.setCustomer(customer);
        booking.setPhotographer(photographer);
        booking.setPhotographyPackage(pkg);
        booking.setEventType(request.eventType().trim().toUpperCase());
        booking.setEventDate(request.eventDate());
        booking.setTimeSlot(request.timeSlot());
        booking.setLocation(request.location().trim());
        booking.setNotes(blankToNull(request.notes()));
        booking.setAmount(pkg == null ? photographer.getHourlyRate().multiply(java.math.BigDecimal.valueOf(8)) : pkg.getPrice());
        booking.setStatus(BookingStatus.PENDING);
        bookingRepository.save(booking);
        notify(photographer.getUser(), "New booking request " + booking.getBookingNumber()
                + " from " + customer.getFullName() + " for " + request.eventDate(), NotificationType.BOOKING);
        return mapper.toBookingResponse(booking);
    }

    public List<BookingResponse> customerBookings() {
        return bookingRepository.findByCustomerIdOrderByIdDesc(currentUser().getId()).stream()
                .map(mapper::toBookingResponse).toList();
    }

    public BookingResponse customerBooking(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Booking not found"));
        requireCustomer(booking);
        return mapper.toBookingResponse(booking);
    }

    @Transactional
    public BookingResponse updateNotes(Long id, BookingNotesRequest request) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Booking not found"));
        requireCustomer(booking);
        if (booking.getStatus() != BookingStatus.PENDING && booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new ConflictException("Booking notes cannot be changed in its current status");
        }
        booking.setNotes(blankToNull(request.notes()));
        bookingRepository.save(booking);
        return mapper.toBookingResponse(booking);
    }

    @Transactional
    public BookingResponse cancelBooking(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Booking not found"));
        requireCustomer(booking);
        if (booking.getStatus() == BookingStatus.COMPLETED || booking.getStatus() == BookingStatus.CANCELLED
                || booking.getStatus() == BookingStatus.DECLINED) {
            throw new ConflictException("Booking cannot be cancelled in its current status");
        }
        booking.setStatus(BookingStatus.CANCELLED);
        bookingRepository.save(booking);
        notify(booking.getPhotographer().getUser(), "Booking " + booking.getBookingNumber() + " was cancelled by the customer.", NotificationType.BOOKING);
        return mapper.toBookingResponse(booking);
    }

    @Transactional
    public UserResponse updateCustomerProfile(CustomerProfileUpdateRequest request) {
        User user = currentUser();
        user.setFullName(request.fullName().trim());
        user.setPhoneNumber(blankToNull(request.phoneNumber()));
        userRepository.save(user);
        PhotographerProfile profile = profileRepository.findByUserId(user.getId()).orElse(null);
        return mapper.toUserResponse(user, profile);
    }

    public List<BookingResponse> photographerBookings() {
        return bookingRepository.findByPhotographerIdOrderByIdDesc(ownProfileId()).stream()
                .map(mapper::toBookingResponse).toList();
    }

    @Transactional
    public BookingResponse photographerBookingAction(Long id, BookingStatusRequest request) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Booking not found"));
        if (!booking.getPhotographer().getId().equals(ownProfileId())) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN, "Booking belongs to another photographer");
        }
        if (request.status() == BookingStatus.PENDING) {
            throw new IllegalArgumentException("A pending booking already has this status");
        }
        if (booking.getStatus() == BookingStatus.PENDING
                && request.status() != BookingStatus.CONFIRMED && request.status() != BookingStatus.DECLINED) {
            throw new ConflictException("A pending booking can only be confirmed or declined");
        }
        if (booking.getStatus() == BookingStatus.CONFIRMED && request.status() != BookingStatus.COMPLETED) {
            throw new ConflictException("A confirmed booking can only be completed");
        }
        if (request.status() == BookingStatus.DECLINED) {
            if (blank(request.reason())) {
                throw new IllegalArgumentException("A reason is required to decline a booking");
            }
            booking.setDeclineReason(request.reason().trim());
        }
        if (request.status() == BookingStatus.COMPLETED && booking.getEventDate().isAfter(LocalDate.now())) {
            throw new ConflictException("A booking can only be completed after its event date");
        }
        if (request.status() == BookingStatus.CONFIRMED && booking.getTimeSlot() != null) {
            slotRepository.findByProfileIdAndDateAndTimeSlot(
                            booking.getPhotographer().getId(), booking.getEventDate(), booking.getTimeSlot())
                    .ifPresent(slot -> {
                        if (slot.isBooked()) {
                            throw new ConflictException("The time slot for this booking is already reserved");
                        }
                        slot.setBooked(true);
                    });
        }
        booking.setStatus(request.status());
        bookingRepository.save(booking);
        notify(booking.getCustomer(), "Booking " + booking.getBookingNumber() + " is now " + request.status(), NotificationType.BOOKING);
        return mapper.toBookingResponse(booking);
    }

    public List<BookingResponse> adminBookings(String status) {
        List<Booking> bookings = bookingRepository.findAll();
        if (status == null || status.isBlank()) {
            return bookings.stream().map(mapper::toBookingResponse).toList();
        }
        BookingStatus parsed;
        try {
            parsed = BookingStatus.valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("Unknown booking status");
        }
        return bookings.stream().filter(booking -> booking.getStatus() == parsed)
                .map(mapper::toBookingResponse).toList();
    }

    @Transactional
    public BookingResponse adminBookingAction(Long id, BookingStatusRequest request) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Booking not found"));
        if (request.status() == BookingStatus.PENDING) {
            throw new IllegalArgumentException("A booking cannot be reset to pending by an admin");
        }
        if (request.status() == BookingStatus.DECLINED && blank(request.reason())) {
            throw new IllegalArgumentException("A reason is required to decline a booking");
        }
        booking.setStatus(request.status());
        booking.setDeclineReason(request.status() == BookingStatus.DECLINED ? request.reason().trim() : null);
        bookingRepository.save(booking);
        notify(booking.getCustomer(), "Admin updated booking " + booking.getBookingNumber() + " to " + request.status(), NotificationType.BOOKING);
        return mapper.toBookingResponse(booking);
    }

    private Long ownProfileId() {
        User user = currentUser();
        return profileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new NotFoundException("Photographer profile not found"))
                .getId();
    }

    private void requireCustomer(Booking booking) {
        if (!booking.getCustomer().getId().equals(currentUser().getId())) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN, "Booking belongs to another customer");
        }
    }

    private User currentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.UNAUTHORIZED, "User session is invalid"));
    }

    private void notify(User recipient, String message, NotificationType type) {
        if (recipient == null) {
            return;
        }
        Notification notification = new Notification();
        notification.setUser(recipient);
        notification.setMessage(message);
        notification.setType(type);
        notificationRepository.save(notification);
    }

    private String createBookingNumber() {
        return "BK-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
    }

    private String blankToNull(String value) {
        return blank(value) ? null : value.trim();
    }

    private boolean blank(String value) {
        return value == null || value.isBlank();
    }
}
