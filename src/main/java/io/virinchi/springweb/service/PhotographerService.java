package io.virinchi.springweb.service;

import io.virinchi.springweb.domain.AvailabilitySlot;
import io.virinchi.springweb.domain.PhotographerProfile;
import io.virinchi.springweb.domain.PhotographyPackage;
import io.virinchi.springweb.domain.PortfolioImage;
import io.virinchi.springweb.domain.Review;
import io.virinchi.springweb.domain.TimeSlot;
import io.virinchi.springweb.domain.User;
import io.virinchi.springweb.dto.ApiDtos.AvailabilitySlotRequest;
import io.virinchi.springweb.dto.ApiDtos.AvailabilitySlotResponse;
import io.virinchi.springweb.dto.ApiDtos.PhotographerProfileRequest;
import io.virinchi.springweb.dto.ApiDtos.PhotographerProfileResponse;
import io.virinchi.springweb.dto.ApiDtos.PhotographyPackageRequest;
import io.virinchi.springweb.dto.ApiDtos.PhotographyPackageResponse;
import io.virinchi.springweb.dto.ApiDtos.PortfolioImageRequest;
import io.virinchi.springweb.dto.ApiDtos.PortfolioImageResponse;
import io.virinchi.springweb.dto.ApiDtos.ReviewResponse;
import io.virinchi.springweb.exception.ConflictException;
import io.virinchi.springweb.exception.NotFoundException;
import io.virinchi.springweb.repository.AvailabilitySlotRepository;
import io.virinchi.springweb.repository.PhotographerProfileRepository;
import io.virinchi.springweb.repository.PhotographyPackageRepository;
import io.virinchi.springweb.repository.PortfolioImageRepository;
import io.virinchi.springweb.repository.ReviewRepository;
import io.virinchi.springweb.repository.UserRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PhotographerService {
    private final PhotographerProfileRepository profileRepository;
    private final PortfolioImageRepository portfolioRepository;
    private final PhotographyPackageRepository packageRepository;
    private final AvailabilitySlotRepository slotRepository;
    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final DtoMapper mapper;

    public PhotographerService(PhotographerProfileRepository profileRepository,
                               PortfolioImageRepository portfolioRepository,
                               PhotographyPackageRepository packageRepository,
                               AvailabilitySlotRepository slotRepository,
                               ReviewRepository reviewRepository,
                               UserRepository userRepository,
                               DtoMapper mapper) {
        this.profileRepository = profileRepository;
        this.portfolioRepository = portfolioRepository;
        this.packageRepository = packageRepository;
        this.slotRepository = slotRepository;
        this.reviewRepository = reviewRepository;
        this.userRepository = userRepository;
        this.mapper = mapper;
    }

    public List<PhotographerProfileResponse> listProfiles(String specialization, String location, BigDecimal maxPrice) {
        String spec = lowercase(specialization);
        String loc = lowercase(location);
        return profileRepository.findAll().stream()
                .filter(profile -> profile.getUser() != null
                        && profile.getUser().getStatus().name().equals("ACTIVE"))
                .filter(profile -> spec == null || profile.getSpecialization().toLowerCase(Locale.ROOT).contains(spec))
                .filter(profile -> loc == null || profile.getLocation().toLowerCase(Locale.ROOT).contains(loc))
                .filter(profile -> maxPrice == null || startingPrice(profile).compareTo(maxPrice) <= 0)
                .sorted(Comparator.comparingDouble(this::rating).reversed().thenComparing(profile -> profile.getUser().getFullName()))
                .map(this::toPublicResponse)
                .toList();
    }

    public PhotographerProfileResponse getProfile(Long id) {
        PhotographerProfile profile = profileRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Photographer profile not found"));
        return toPublicResponse(profile);
    }

    public List<PhotographyPackageResponse> getPackages(Long id) {
        requireProfile(id);
        return packageRepository.findByProfileIdAndActiveTrueOrderByIdAsc(id).stream().map(mapper::toPackageResponse).toList();
    }

    public List<PortfolioImageResponse> getPortfolio(Long id) {
        requireProfile(id);
        return portfolioRepository.findByProfileIdOrderBySortOrderAsc(id).stream().map(mapper::toPortfolioResponse).toList();
    }

    public List<ReviewResponse> getReviews(Long id) {
        requireProfile(id);
        return reviewRepository.findByPhotographerIdOrderByCreatedAtDesc(id).stream().map(mapper::toReviewResponse).toList();
    }

    public List<AvailabilitySlotResponse> getAvailability(Long id) {
        requireProfile(id);
        return slotRepository.findByProfileIdOrderByDateAsc(id).stream()
                .map(slot -> new AvailabilitySlotResponse(slot.getId(), slot.getDate(), slot.getTimeSlot(), slot.isBooked()))
                .toList();
    }

    public boolean checkAvailability(Long id, LocalDate date, TimeSlot timeSlot) {
        requireProfile(id);
        if (date == null || timeSlot == null || date.isBefore(LocalDate.now())) {
            return false;
        }
        return slotRepository.findByProfileIdAndDateAndTimeSlot(id, date, timeSlot)
                .map(slot -> !slot.isBooked())
                .orElse(false);
    }

    @Transactional
    public PhotographerProfileResponse updateOwnProfile(PhotographerProfileRequest request) {
        PhotographerProfile profile = ownProfile();
        profile.setBio(blankToNull(request.bio()));
        profile.setSpecialization(request.specialization().trim());
        profile.setLocation(request.location().trim());
        profile.setExperienceYears(request.experienceYears());
        profile.setHourlyRate(request.hourlyRate());
        profile.setAvatarUrl(blankToNull(request.avatarUrl()));
        profile.setCoverImageUrl(blankToNull(request.coverImageUrl()));
        profile.setResponseHours(request.responseHours() == null ? profile.getResponseHours() : request.responseHours());
        profileRepository.save(profile);
        return toOwnResponse(profile);
    }

    @Transactional
    public PortfolioImageResponse createPortfolioImage(PortfolioImageRequest request) {
        PhotographerProfile profile = ownProfile();
        PortfolioImage image = new PortfolioImage();
        image.setProfile(profile);
        image.setImageUrl(request.imageUrl().trim());
        image.setCaption(blankToNull(request.caption()));
        image.setCategory(blankToNull(request.category()));
        image.setSortOrder(request.sortOrder());
        portfolioRepository.save(image);
        return mapper.toPortfolioResponse(image);
    }

    @Transactional
    public PortfolioImageResponse updatePortfolioImage(Long id, PortfolioImageRequest request) {
        PortfolioImage image = portfolioRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Portfolio image not found"));
        requireOwnership(image.getProfile());
        image.setImageUrl(request.imageUrl().trim());
        image.setCaption(blankToNull(request.caption()));
        image.setCategory(blankToNull(request.category()));
        image.setSortOrder(request.sortOrder());
        portfolioRepository.save(image);
        return mapper.toPortfolioResponse(image);
    }

    @Transactional
    public void deletePortfolioImage(Long id) {
        PortfolioImage image = portfolioRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Portfolio image not found"));
        requireOwnership(image.getProfile());
        portfolioRepository.delete(image);
    }

    @Transactional
    public PhotographyPackageResponse createPackage(PhotographyPackageRequest request) {
        PhotographerProfile profile = ownProfile();
        PhotographyPackage pkg = new PhotographyPackage();
        pkg.setProfile(profile);
        pkg.setName(request.name().trim());
        pkg.setCategory(request.category().trim());
        pkg.setDescription(blankToNull(request.description()));
        pkg.setPrice(request.price());
        pkg.setDurationHours(request.durationHours());
        pkg.setActive(request.active());
        packageRepository.save(pkg);
        return mapper.toPackageResponse(pkg);
    }

    @Transactional
    public PhotographyPackageResponse updatePackage(Long id, PhotographyPackageRequest request) {
        PhotographyPackage pkg = packageRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Package not found"));
        requireOwnership(pkg.getProfile());
        pkg.setName(request.name().trim());
        pkg.setCategory(request.category().trim());
        pkg.setDescription(blankToNull(request.description()));
        pkg.setPrice(request.price());
        pkg.setDurationHours(request.durationHours());
        pkg.setActive(request.active());
        packageRepository.save(pkg);
        return mapper.toPackageResponse(pkg);
    }

    @Transactional
    public void deletePackage(Long id) {
        PhotographyPackage pkg = packageRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Package not found"));
        requireOwnership(pkg.getProfile());
        packageRepository.delete(pkg);
    }

    @Transactional
    public AvailabilitySlotResponse createSlot(AvailabilitySlotRequest request) {
        PhotographerProfile profile = ownProfile();
        if (request.date().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Availability date cannot be in the past");
        }
        if (slotRepository.findByProfileIdAndDateAndTimeSlot(profile.getId(), request.date(), request.timeSlot()).isPresent()) {
            throw new ConflictException("This availability slot already exists");
        }
        AvailabilitySlot slot = new AvailabilitySlot();
        slot.setProfile(profile);
        slot.setDate(request.date());
        slot.setTimeSlot(request.timeSlot());
        slotRepository.save(slot);
        return new AvailabilitySlotResponse(slot.getId(), slot.getDate(), slot.getTimeSlot(), slot.isBooked());
    }

    @Transactional
    public void deleteSlot(Long id) {
        AvailabilitySlot slot = slotRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Availability slot not found"));
        requireOwnership(slot.getProfile());
        if (slot.isBooked()) {
            throw new ConflictException("Booked slots cannot be deleted");
        }
        slotRepository.delete(slot);
    }

    public PhotographerProfileResponse toPublicResponse(PhotographerProfile profile) {
        List<PortfolioImage> portfolio = portfolioRepository.findByProfileIdOrderBySortOrderAsc(profile.getId());
        List<PhotographyPackage> packages = packageRepository.findByProfileIdAndActiveTrueOrderByIdAsc(profile.getId());
        List<Review> reviews = reviewRepository.findByPhotographerIdOrderByCreatedAtDesc(profile.getId());
        return mapper.toProfileResponse(profile, portfolio, packages, reviews);
    }

    public PhotographerProfileResponse toOwnResponse(PhotographerProfile profile) {
        return toPublicResponse(profile);
    }

    public PhotographerProfileResponse ownProfileResponse() {
        return toOwnResponse(ownProfile());
    }

    public Long currentProfileId() {
        return ownProfile().getId();
    }

    private BigDecimal startingPrice(PhotographerProfile profile) {
        List<PhotographyPackage> packages = packageRepository.findByProfileIdAndActiveTrueOrderByIdAsc(profile.getId());
        if (packages.isEmpty()) {
            return profile.getHourlyRate();
        }
        return packages.stream().map(PhotographyPackage::getPrice).min(Comparator.naturalOrder()).orElse(profile.getHourlyRate());
    }

    private double rating(PhotographerProfile profile) {
        return reviewRepository.findByPhotographerIdOrderByCreatedAtDesc(profile.getId()).stream()
                .mapToInt(Review::getRating).average().orElse(0);
    }

    private PhotographerProfile requireProfile(Long id) {
        return profileRepository.findById(id).orElseThrow(() -> new NotFoundException("Photographer profile not found"));
    }

    private PhotographerProfile ownProfile() {
        User user = currentUser();
        return profileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new NotFoundException("Photographer profile not found"));
    }

    private void requireOwnership(PhotographerProfile profile) {
        if (!profile.getUser().getId().equals(currentUser().getId())) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN, "This resource belongs to another photographer");
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

    private String lowercase(String value) {
        return value == null ? null : value.trim().toLowerCase(Locale.ROOT);
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
