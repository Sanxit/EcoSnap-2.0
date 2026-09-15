package io.virinchi.springweb.service;

import io.virinchi.springweb.domain.Booking;
import io.virinchi.springweb.domain.InquiryStatus;
import io.virinchi.springweb.domain.PhotographerProfile;
import io.virinchi.springweb.domain.Review;
import io.virinchi.springweb.domain.User;
import io.virinchi.springweb.domain.UserStatus;
import io.virinchi.springweb.dto.ApiDtos.BookingResponse;
import io.virinchi.springweb.dto.ApiDtos.ContactInquiryResponse;
import io.virinchi.springweb.dto.ApiDtos.PhotographerAdminResponse;
import io.virinchi.springweb.dto.ApiDtos.PhotographerProfileResponse;
import io.virinchi.springweb.dto.ApiDtos.ReviewResponse;
import io.virinchi.springweb.dto.ApiDtos.UserAdminResponse;
import io.virinchi.springweb.dto.ApiDtos.AdminStatsResponse;
import io.virinchi.springweb.exception.NotFoundException;
import io.virinchi.springweb.repository.BookingRepository;
import io.virinchi.springweb.repository.ContactInquiryRepository;
import io.virinchi.springweb.repository.PhotographerProfileRepository;
import io.virinchi.springweb.repository.ReviewRepository;
import io.virinchi.springweb.repository.UserRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import io.virinchi.springweb.domain.Notification;
import io.virinchi.springweb.domain.NotificationType;
import io.virinchi.springweb.domain.UserRole;
import io.virinchi.springweb.dto.ApiDtos.AdminCreateUserRequest;
import io.virinchi.springweb.dto.ApiDtos.AdminNoticeRequest;
import io.virinchi.springweb.dto.ApiDtos.PhotographerProfileRequest;
import io.virinchi.springweb.exception.ConflictException;
import io.virinchi.springweb.repository.NotificationRepository;
import org.springframework.security.crypto.password.PasswordEncoder;

@Service
public class AdminService {
    private final UserRepository userRepository;
    private final PhotographerProfileRepository profileRepository;
    private final BookingRepository bookingRepository;
    private final ReviewRepository reviewRepository;
    private final ContactInquiryRepository inquiryRepository;
    private final BookingService bookingService;
    private final ReviewService reviewService;
    private final ContactService contactService;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;
    private final NotificationRepository notificationRepository;

    public AdminService(UserRepository userRepository,
                        PhotographerProfileRepository profileRepository,
                        BookingRepository bookingRepository,
                        ReviewRepository reviewRepository,
                        ContactInquiryRepository inquiryRepository,
                        BookingService bookingService,
                        ReviewService reviewService,
                        ContactService contactService,
                        EmailService emailService,
                        PasswordEncoder passwordEncoder,
                        NotificationRepository notificationRepository) {
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
        this.bookingRepository = bookingRepository;
        this.reviewRepository = reviewRepository;
        this.inquiryRepository = inquiryRepository;
        this.bookingService = bookingService;
        this.reviewService = reviewService;
        this.contactService = contactService;
        this.emailService = emailService;
        this.passwordEncoder = passwordEncoder;
        this.notificationRepository = notificationRepository;
    }

    public AdminStatsResponse stats() {
        List<Booking> bookings = bookingRepository.findAll();
        BigDecimal revenue = bookings.stream()
                .filter(booking -> booking.getStatus().name().equals("COMPLETED"))
                .map(Booking::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return new AdminStatsResponse(userRepository.count(), profileRepository.count(),
                bookings.size(), reviewRepository.count(), inquiryRepository.count(), revenue);
    }

    public List<UserAdminResponse> users() {
        return userRepository.findAll().stream()
                .map(user -> new UserAdminResponse(user.getId(), user.getFullName(), user.getEmail(),
                        user.getPhoneNumber(), user.getRole(), user.getStatus(), user.getCreatedAt()))
                .toList();
    }

    public List<PhotographerAdminResponse> photographers() {
        return profileRepository.findAll().stream()
                .map(profile -> {
                    User owner = profile.getUser();
                    List<Review> reviews = reviewRepository.findByPhotographerIdOrderByCreatedAtDesc(profile.getId());
                    double rating = reviews.stream().mapToInt(Review::getRating).average().orElse(0);
                    return new PhotographerAdminResponse(profile.getId(), owner.getId(), owner.getFullName(),
                            owner.getEmail(), profile.getSpecialization(), profile.getLocation(),
                            profile.getExperienceYears(), profile.getHourlyRate(), profile.isVerified(),
                            rating, reviews.size(), bookingRepository.findByPhotographerIdOrderByIdDesc(profile.getId()).size());
                })
                .toList();
    }

    public PhotographerProfile requireProfile(Long id) {
        return profileRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Photographer profile not found"));
    }

    public List<BookingResponse> adminBookings(String status) {
        return bookingService.adminBookings(status);
    }

    @Transactional
    public BookingResponse adminBookingAction(Long id, io.virinchi.springweb.dto.ApiDtos.BookingStatusRequest request) {
        return bookingService.adminBookingAction(id, request);
    }

    public List<ReviewResponse> adminReviews(String search) {
        return reviewService.adminReviews(search);
    }

    @Transactional
    public void adminDeleteReview(Long id) {
        reviewService.adminDeleteReview(id);
    }

    public List<ContactInquiryResponse> inquiries(String status) {
        return contactService.list(status);
    }

    @Transactional
    public ContactInquiryResponse updateInquiryStatus(Long id, InquiryStatus status) {
        return contactService.updateStatus(id, status);
    }

    @Transactional
    public UserAdminResponse updateUserStatus(Long id, String status) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("User not found"));
        UserStatus previousStatus = user.getStatus();
        if (status == null || status.isBlank()) {
            throw new IllegalArgumentException("Status is required");
        }
        UserStatus userStatus = UserStatus.valueOf(status.trim().toUpperCase(Locale.ROOT));
        user.setStatus(userStatus);
        userRepository.save(user);
        if (previousStatus == UserStatus.PENDING && userStatus == UserStatus.ACTIVE) {
            sendAfterCommit(() -> emailService.sendApproval(user));
        }
        return new UserAdminResponse(user.getId(), user.getFullName(), user.getEmail(),
                user.getPhoneNumber(), user.getRole(), user.getStatus(), user.getCreatedAt());
    }

    private void sendAfterCommit(Runnable action) {
        if (TransactionSynchronizationManager.isActualTransactionActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    action.run();
                }
            });
        } else {
            action.run();
        }
    }

    @Transactional
    public PhotographerAdminResponse verifyPhotographer(Long id) {
        PhotographerProfile profile = profileRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Photographer profile not found"));
        profile.setVerified(true);
        profileRepository.save(profile);
        User owner = profile.getUser();
        List<Review> reviews = reviewRepository.findByPhotographerIdOrderByCreatedAtDesc(profile.getId());
        double rating = reviews.stream().mapToInt(Review::getRating).average().orElse(0);
        return new PhotographerAdminResponse(profile.getId(), owner.getId(), owner.getFullName(),
                owner.getEmail(), profile.getSpecialization(), profile.getLocation(),
                profile.getExperienceYears(), profile.getHourlyRate(), profile.isVerified(),
                rating, reviews.size(), bookingRepository.findByPhotographerIdOrderByIdDesc(profile.getId()).size());
    }

    @Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("User not found"));
        userRepository.delete(user);
    }

    @Transactional
    public void deletePhotographer(Long id) {
        PhotographerProfile profile = profileRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Photographer profile not found"));
        profileRepository.delete(profile);
    }

    @Transactional
    public UserAdminResponse createUser(AdminCreateUserRequest request) {
        String email = request.email().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new ConflictException("Email already in use");
        }
        User user = new User();
        user.setFullName(request.fullName().trim());
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setPhoneNumber(request.phoneNumber());
        user.setRole(request.role());
        user.setStatus(request.status());
        user = userRepository.save(user);

        if (request.role() == UserRole.PHOTOGRAPHER) {
            PhotographerProfile profile = new PhotographerProfile();
            profile.setUser(user);
            profile.setSpecialization("General Photography");
            profile.setLocation("Kathmandu");
            profile.setExperienceYears(0);
            profile.setHourlyRate(BigDecimal.ZERO);
            profile.setVerified(request.status() == UserStatus.ACTIVE);
            profileRepository.save(profile);
        }

        return new UserAdminResponse(user.getId(), user.getFullName(), user.getEmail(),
                user.getPhoneNumber(), user.getRole(), user.getStatus(), user.getCreatedAt());
    }

    @Transactional
    public PhotographerAdminResponse updatePhotographer(Long id, PhotographerProfileRequest request) {
        PhotographerProfile profile = profileRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Photographer profile not found"));
        if (request.specialization() != null && !request.specialization().isBlank()) {
            profile.setSpecialization(request.specialization().trim());
        }
        if (request.location() != null && !request.location().isBlank()) {
            profile.setLocation(request.location().trim());
        }
        profile.setExperienceYears(request.experienceYears());
        if (request.hourlyRate() != null) {
            profile.setHourlyRate(request.hourlyRate());
        }
        if (request.bio() != null) {
            profile.setBio(request.bio().trim());
        }
        profileRepository.save(profile);

        User owner = profile.getUser();
        List<Review> reviews = reviewRepository.findByPhotographerIdOrderByCreatedAtDesc(profile.getId());
        double rating = reviews.stream().mapToInt(Review::getRating).average().orElse(0);
        return new PhotographerAdminResponse(profile.getId(), owner.getId(), owner.getFullName(),
                owner.getEmail(), profile.getSpecialization(), profile.getLocation(),
                profile.getExperienceYears(), profile.getHourlyRate(), profile.isVerified(),
                rating, reviews.size(), bookingRepository.findByPhotographerIdOrderByIdDesc(profile.getId()).size());
    }

    @Transactional
    public void broadcastNotice(AdminNoticeRequest request) {
        String target = request.targetRole() == null ? "ALL" : request.targetRole().toUpperCase();
        List<User> targetUsers = userRepository.findAll().stream()
                .filter(u -> {
                    if ("CUSTOMER".equals(target) || "CLIENT".equals(target)) {
                        return u.getRole() == UserRole.CUSTOMER;
                    } else if ("PHOTOGRAPHER".equals(target)) {
                        return u.getRole() == UserRole.PHOTOGRAPHER;
                    }
                    return true;
                })
                .toList();

        for (User u : targetUsers) {
            Notification n = new Notification();
            n.setUser(u);
            n.setMessage(request.title() + ": " + request.message());
            n.setType(NotificationType.PLATFORM);
            n.setRead(false);
            notificationRepository.save(n);
        }
    }
}