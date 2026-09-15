package io.virinchi.springweb.controller;

import io.virinchi.springweb.dto.ApiDtos.AvailabilitySlotRequest;
import io.virinchi.springweb.dto.ApiDtos.AvailabilitySlotResponse;
import io.virinchi.springweb.dto.ApiDtos.BookingResponse;
import io.virinchi.springweb.dto.ApiDtos.BookingStatusRequest;
import io.virinchi.springweb.dto.ApiDtos.NotificationResponse;
import io.virinchi.springweb.dto.ApiDtos.PhotographerProfileRequest;
import io.virinchi.springweb.dto.ApiDtos.PhotographerProfileResponse;
import io.virinchi.springweb.dto.ApiDtos.PhotographyPackageRequest;
import io.virinchi.springweb.dto.ApiDtos.PhotographyPackageResponse;
import io.virinchi.springweb.dto.ApiDtos.PortfolioImageRequest;
import io.virinchi.springweb.dto.ApiDtos.PortfolioImageResponse;
import io.virinchi.springweb.dto.ApiDtos.ReviewResponse;
import io.virinchi.springweb.service.BookingService;
import io.virinchi.springweb.service.NotificationService;
import io.virinchi.springweb.service.PhotographerService;
import io.virinchi.springweb.service.ReviewService;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/photographer")
public class PhotographerController {
    private final PhotographerService photographerService;
    private final BookingService bookingService;
    private final ReviewService reviewService;
    private final NotificationService notificationService;

    public PhotographerController(PhotographerService photographerService,
                                  BookingService bookingService,
                                  ReviewService reviewService,
                                  NotificationService notificationService) {
        this.photographerService = photographerService;
        this.bookingService = bookingService;
        this.reviewService = reviewService;
        this.notificationService = notificationService;
    }

    @GetMapping("/profile")
    public PhotographerProfileResponse profile() {
        return photographerService.ownProfileResponse();
    }

    @PutMapping("/profile")
    public PhotographerProfileResponse updateProfile(@Valid @RequestBody PhotographerProfileRequest request) {
        return photographerService.updateOwnProfile(request);
    }

    @GetMapping("/portfolio")
    public List<PortfolioImageResponse> portfolio() {
        return photographerService.getPortfolio(currentProfileId());
    }

    @PostMapping("/portfolio")
    @ResponseStatus(HttpStatus.CREATED)
    public PortfolioImageResponse createPortfolio(@Valid @RequestBody PortfolioImageRequest request) {
        return photographerService.createPortfolioImage(request);
    }

    @PutMapping("/portfolio/{id}")
    public PortfolioImageResponse updatePortfolio(@PathVariable Long id, @Valid @RequestBody PortfolioImageRequest request) {
        return photographerService.updatePortfolioImage(id, request);
    }

    @DeleteMapping("/portfolio/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePortfolio(@PathVariable Long id) {
        photographerService.deletePortfolioImage(id);
    }

    @GetMapping("/packages")
    public List<PhotographyPackageResponse> packages() {
        return photographerService.getPackages(currentProfileId());
    }

    @PostMapping("/packages")
    @ResponseStatus(HttpStatus.CREATED)
    public PhotographyPackageResponse createPackage(@Valid @RequestBody PhotographyPackageRequest request) {
        return photographerService.createPackage(request);
    }

    @PutMapping("/packages/{id}")
    public PhotographyPackageResponse updatePackage(@PathVariable Long id, @Valid @RequestBody PhotographyPackageRequest request) {
        return photographerService.updatePackage(id, request);
    }

    @DeleteMapping("/packages/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePackage(@PathVariable Long id) {
        photographerService.deletePackage(id);
    }

    @GetMapping("/availability")
    public List<AvailabilitySlotResponse> availability() {
        return photographerService.getAvailability(currentProfileId());
    }

    @PostMapping("/availability")
    @ResponseStatus(HttpStatus.CREATED)
    public AvailabilitySlotResponse createAvailability(@Valid @RequestBody AvailabilitySlotRequest request) {
        return photographerService.createSlot(request);
    }

    @DeleteMapping("/availability/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAvailability(@PathVariable Long id) {
        photographerService.deleteSlot(id);
    }

    @GetMapping("/bookings")
    public List<BookingResponse> bookings() {
        return bookingService.photographerBookings();
    }

    @PostMapping("/bookings/{id}/status")
    public BookingResponse bookingStatus(@PathVariable Long id, @Valid @RequestBody BookingStatusRequest request) {
        return bookingService.photographerBookingAction(id, request);
    }

    @GetMapping("/reviews")
    public List<ReviewResponse> reviews() {
        return reviewService.photographerReviews();
    }

    @GetMapping("/notifications")
    public List<NotificationResponse> notifications() {
        return notificationService.currentNotifications();
    }

    @PatchMapping("/notifications/{id}/read")
    public NotificationResponse markRead(@PathVariable Long id) {
        return notificationService.markRead(id);
    }

    @PostMapping("/notifications/read-all")
    public void markAllRead() {
        notificationService.markAllRead();
    }

    @DeleteMapping("/notifications/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteNotification(@PathVariable Long id) {
        notificationService.deleteNotification(id);
    }

    @GetMapping("/availability/check")
    public boolean checkAvailability(@RequestParam LocalDate date, @RequestParam String timeSlot) {
        return photographerService.checkAvailability(currentProfileId(), date,
                io.virinchi.springweb.domain.TimeSlot.valueOf(timeSlot.toUpperCase()));
    }

    private Long currentProfileId() {
        return photographerService.currentProfileId();
    }
}
