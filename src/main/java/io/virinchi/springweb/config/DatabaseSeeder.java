package io.virinchi.springweb.config;

import io.virinchi.springweb.domain.*;
import io.virinchi.springweb.repository.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;

@Component
@Profile("!test")
public class DatabaseSeeder implements CommandLineRunner {
    private final UserRepository userRepository;
    private final PhotographerProfileRepository profileRepository;
    private final PhotographyPackageRepository packageRepository;
    private final PortfolioImageRepository portfolioRepository;
    private final AvailabilitySlotRepository slotRepository;
    private final BookingRepository bookingRepository;
    private final ReviewRepository reviewRepository;
    private final ContactInquiryRepository inquiryRepository;
    private final NotificationRepository notificationRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final String adminEmail;
    private final String adminPassword;

    public DatabaseSeeder(UserRepository userRepository,
                          PhotographerProfileRepository profileRepository,
                          PhotographyPackageRepository packageRepository,
                          PortfolioImageRepository portfolioRepository,
                          AvailabilitySlotRepository slotRepository,
                          BookingRepository bookingRepository,
                          ReviewRepository reviewRepository,
                          ContactInquiryRepository inquiryRepository,
                          NotificationRepository notificationRepository,
                          PasswordResetTokenRepository passwordResetTokenRepository,
                          PasswordEncoder passwordEncoder,
                          @Value("${ecosnap.admin.email:admin@ecosnap.com}") String adminEmail,
                          @Value("${ecosnap.admin.password:Admin@12345}") String adminPassword) {
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
        this.packageRepository = packageRepository;
        this.portfolioRepository = portfolioRepository;
        this.slotRepository = slotRepository;
        this.bookingRepository = bookingRepository;
        this.reviewRepository = reviewRepository;
        this.inquiryRepository = inquiryRepository;
        this.notificationRepository = notificationRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.adminEmail = adminEmail;
        this.adminPassword = adminPassword;
    }

    @Override
    @Transactional
    public void run(String... args) {
        cleanDisallowedAccounts();
        seedAdmin();
        seedRabicPhotographer();
        seedSanxitClient();
    }

    /**
     * Keep only admin, sanxitsapkota@gmail.com, rabic896@gmail.com.
     * Remove any other accounts, photographer profiles, and orphan records tied to them.
     */
    private void cleanDisallowedAccounts() {
        String admin = adminEmail.trim().toLowerCase();
        Set<String> allowedEmails = Set.of(admin, "sanxitsapkota@gmail.com", "rabic896@gmail.com");

        List<User> allUsers = userRepository.findAll();
        for (User user : allUsers) {
            String email = user.getEmail() != null ? user.getEmail().trim().toLowerCase() : "";
            if (!allowedEmails.contains(email)) {
                // Delete user's notifications & reset tokens
                List<Notification> notifs = notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
                notificationRepository.deleteAll(notifs);

                // If user is a customer, remove customer reviews & bookings
                List<Review> customerReviews = reviewRepository.findByCustomerIdOrderByCreatedAtDesc(user.getId());
                reviewRepository.deleteAll(customerReviews);

                List<Booking> customerBookings = bookingRepository.findByCustomerIdOrderByIdDesc(user.getId());
                for (Booking b : customerBookings) {
                    reviewRepository.findByBookingId(b.getId()).ifPresent(reviewRepository::delete);
                    bookingRepository.delete(b);
                }

                // If user has a photographer profile, remove profile and all children
                profileRepository.findByUserId(user.getId()).ifPresent(profile -> {
                    reviewRepository.deleteAll(reviewRepository.findByPhotographerIdOrderByCreatedAtDesc(profile.getId()));
                    bookingRepository.deleteAll(bookingRepository.findByPhotographerIdOrderByIdDesc(profile.getId()));
                    slotRepository.deleteAll(slotRepository.findByProfileIdOrderByDateAsc(profile.getId()));
                    packageRepository.deleteAll(packageRepository.findByProfileIdOrderByPriceAsc(profile.getId()));
                    portfolioRepository.deleteAll(portfolioRepository.findByProfileIdOrderBySortOrderAsc(profile.getId()));
                    profileRepository.delete(profile);
                });

                userRepository.delete(user);
            }
        }
    }

    private void seedAdmin() {
        String email = adminEmail.trim().toLowerCase();
        if (email.isEmpty() || adminPassword == null || adminPassword.isBlank()) {
            return;
        }
        if (!userRepository.existsByEmail(email)) {
            User admin = new User();
            admin.setFullName("EcoSnap Administrator");
            admin.setEmail(email);
            admin.setPasswordHash(passwordEncoder.encode(adminPassword));
            admin.setRole(UserRole.ADMIN);
            admin.setStatus(UserStatus.ACTIVE);
            userRepository.save(admin);
        }
    }

    private void seedRabicPhotographer() {
        String email = "rabic896@gmail.com";
        String defaultPw = passwordEncoder.encode("Password@123");

        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            user = new User();
            user.setFullName("Rabi Chaudhary");
            user.setEmail(email);
            user.setPasswordHash(defaultPw);
            user.setPhoneNumber("9801234567");
            user.setRole(UserRole.PHOTOGRAPHER);
            user.setStatus(UserStatus.ACTIVE);
            user = userRepository.save(user);
        } else {
            user.setRole(UserRole.PHOTOGRAPHER);
            user.setStatus(UserStatus.ACTIVE);
            user = userRepository.save(user);
        }

        final User savedUser = user;
        PhotographerProfile profile = profileRepository.findByUserId(user.getId()).orElseGet(() -> {
            PhotographerProfile p = new PhotographerProfile();
            p.setUser(savedUser);
            p.setSpecialization("Wedding, Portrait, Nature");
            p.setLocation("Kathmandu");
            p.setExperienceYears(6);
            p.setHourlyRate(new BigDecimal("2500.00"));
            p.setAvatarUrl("https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80");
            p.setCoverImageUrl("https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&auto=format&fit=crop&q=80");
            p.setBio("Award-winning visual storyteller specializing in weddings, portraits, and outdoor events across Kathmandu.");
            p.setVerified(true);
            p.setResponseHours(2);
            return profileRepository.save(p);
        });

        // Seed packages if none exist
        if (packageRepository.findByProfileIdOrderByPriceAsc(profile.getId()).isEmpty()) {
            PhotographyPackage p1 = new PhotographyPackage();
            p1.setProfile(profile);
            p1.setName("Starter Portrait");
            p1.setCategory("PORTRAIT");
            p1.setDescription("1 hour outdoor session with 15 high-res retouched photos.");
            p1.setPrice(new BigDecimal("5000.00"));
            p1.setDurationHours(1);
            p1.setActive(true);
            packageRepository.save(p1);

            PhotographyPackage p2 = new PhotographyPackage();
            p2.setProfile(profile);
            p2.setName("Wedding Premium");
            p2.setCategory("WEDDING");
            p2.setDescription("Comprehensive 8 hours wedding coverage with album and 300+ edited shots.");
            p2.setPrice(new BigDecimal("45000.00"));
            p2.setDurationHours(8);
            p2.setActive(true);
            packageRepository.save(p2);
        }

        // Seed portfolio if none exists
        if (portfolioRepository.findByProfileIdOrderBySortOrderAsc(profile.getId()).isEmpty()) {
            PortfolioImage pi1 = new PortfolioImage();
            pi1.setProfile(profile);
            pi1.setImageUrl("https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80");
            pi1.setCaption("Traditional Nepali Wedding");
            pi1.setCategory("WEDDING");
            pi1.setSortOrder(1);
            portfolioRepository.save(pi1);

            PortfolioImage pi2 = new PortfolioImage();
            pi2.setProfile(profile);
            pi2.setImageUrl("https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80");
            pi2.setCaption("Golden Hour Portrait");
            pi2.setCategory("PORTRAIT");
            pi2.setSortOrder(2);
            portfolioRepository.save(pi2);
        }

        // Seed availability slots for the next 14 days if none exist
        if (slotRepository.findByProfileIdOrderByDateAsc(profile.getId()).isEmpty()) {
            LocalDate today = LocalDate.now();
            for (int i = 1; i <= 14; i++) {
                LocalDate slotDate = today.plusDays(i);
                for (TimeSlot ts : List.of(TimeSlot.MORNING, TimeSlot.AFTERNOON, TimeSlot.EVENING)) {
                    AvailabilitySlot slot = new AvailabilitySlot();
                    slot.setProfile(profile);
                    slot.setDate(slotDate);
                    slot.setTimeSlot(ts);
                    slot.setBooked(false);
                    slotRepository.save(slot);
                }
            }
        }
    }

    private void seedSanxitClient() {
        String clientEmail = "sanxitsapkota@gmail.com";
        User client = userRepository.findByEmail(clientEmail).orElse(null);
        if (client == null) {
            client = new User();
            client.setFullName("Sanxit Sapkota");
            client.setEmail(clientEmail);
            client.setPasswordHash(passwordEncoder.encode("Password@123"));
            client.setPhoneNumber("9841234567");
            client.setRole(UserRole.CUSTOMER);
            client.setStatus(UserStatus.ACTIVE);
            userRepository.save(client);
        } else {
            client.setRole(UserRole.CUSTOMER);
            client.setStatus(UserStatus.ACTIVE);
            userRepository.save(client);
        }
    }
}
