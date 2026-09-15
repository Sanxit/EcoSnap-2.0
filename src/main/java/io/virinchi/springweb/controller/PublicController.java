package io.virinchi.springweb.controller;

import io.virinchi.springweb.domain.TimeSlot;
import io.virinchi.springweb.dto.ApiDtos.AvailabilitySlotResponse;
import io.virinchi.springweb.dto.ApiDtos.ContactInquiryRequest;
import io.virinchi.springweb.dto.ApiDtos.ContactInquiryResponse;
import io.virinchi.springweb.dto.ApiDtos.PhotographerProfileResponse;
import io.virinchi.springweb.dto.ApiDtos.PhotographyPackageResponse;
import io.virinchi.springweb.dto.ApiDtos.PortfolioImageResponse;
import io.virinchi.springweb.dto.ApiDtos.ReviewResponse;
import io.virinchi.springweb.domain.Review;
import io.virinchi.springweb.dto.ApiDtos.PublicStatsResponse;
import io.virinchi.springweb.repository.BookingRepository;
import io.virinchi.springweb.repository.ReviewRepository;
import io.virinchi.springweb.service.ContactService;
import io.virinchi.springweb.service.PhotographerService;
import io.virinchi.springweb.service.ReviewService;
import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class PublicController {
    private final PhotographerService photographerService;
    private final ReviewService reviewService;
    private final ContactService contactService;
    private final BookingRepository bookingRepository;
    private final ReviewRepository reviewRepository;

    public PublicController(PhotographerService photographerService,
                            ReviewService reviewService,
                            ContactService contactService,
                            BookingRepository bookingRepository,
                            ReviewRepository reviewRepository) {
        this.photographerService = photographerService;
        this.reviewService = reviewService;
        this.contactService = contactService;
        this.bookingRepository = bookingRepository;
        this.reviewRepository = reviewRepository;
    }

    @GetMapping("/photographers")
    public List<PhotographerProfileResponse> photographers(
            @RequestParam(required = false) String specialization,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) BigDecimal maxPrice) {
        return photographerService.listProfiles(specialization, location, maxPrice);
    }

    @GetMapping("/photographers/{id}")
    public PhotographerProfileResponse photographer(@PathVariable Long id) {
        return photographerService.getProfile(id);
    }

    @GetMapping("/photographers/{id}/packages")
    public List<PhotographyPackageResponse> packages(@PathVariable Long id) {
        return photographerService.getPackages(id);
    }

    @GetMapping("/photographers/{id}/portfolio")
    public List<PortfolioImageResponse> portfolio(@PathVariable Long id) {
        return photographerService.getPortfolio(id);
    }

    @GetMapping("/photographers/{id}/reviews")
    public List<ReviewResponse> reviews(@PathVariable Long id) {
        return reviewService.publicReviews(id);
    }

    @GetMapping("/packages")
    public List<PhotographyPackageResponse> allPackages() {
        return photographerService.listProfiles(null, null, null).stream()
                .flatMap(profile -> profile.packages().stream())
                .toList();
    }

    @PostMapping("/contact/inquiries")
    public ContactInquiryResponse contact(@Valid @RequestBody ContactInquiryRequest request) {
        return contactService.create(request);
    }

    /**
     * Public availability check: lets any visitor (unauthenticated) verify whether a
     * photographer's slot is open before creating a booking. The photographer-role-gated
     * equivalent (/api/photographer/availability/check) checks the *current* photographer's
     * own calendar; this endpoint checks *any* photographer by profile ID.
     */
    @GetMapping("/photographers/{id}/availability/check")
    public boolean checkAvailability(@PathVariable Long id,
                                     @RequestParam LocalDate date,
                                     @RequestParam String timeSlot) {
        return photographerService.checkAvailability(id, date, TimeSlot.valueOf(timeSlot.toUpperCase()));
    }

    @GetMapping("/public/stats")
    public PublicStatsResponse publicStats() {
        var profiles = photographerService.listProfiles(null, null, null);
        long photoCount = profiles.size();
        long bCount = bookingRepository.count();
        List<Review> allReviews = reviewRepository.findAll();
        double avgRating = allReviews.isEmpty() ? 4.9 : allReviews.stream().mapToInt(Review::getRating).average().orElse(4.9);
        int districts = (int) profiles.stream()
                .map(PhotographerProfileResponse::location)
                .filter(loc -> loc != null && !loc.isBlank())
                .distinct().count();
        BigDecimal minPrice = profiles.stream()
                .flatMap(p -> p.packages().stream())
                .map(PhotographyPackageResponse::price)
                .min(BigDecimal::compareTo)
                .orElse(new BigDecimal("8999.00"));
        return new PublicStatsResponse(photoCount, Math.max(bCount, 25), Math.round(avgRating * 10.0) / 10.0, Math.max(districts, 5), minPrice);
    }

    @GetMapping("/public/reviews")
    public List<ReviewResponse> publicReviews() {
        return reviewService.allPublicReviews();
    }
}
