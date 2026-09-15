package io.virinchi.springweb.controller;

import io.virinchi.springweb.dto.ApiDtos.BookingNotesRequest;
import io.virinchi.springweb.dto.ApiDtos.BookingRequest;
import io.virinchi.springweb.dto.ApiDtos.BookingResponse;
import io.virinchi.springweb.dto.ApiDtos.CustomerProfileUpdateRequest;
import io.virinchi.springweb.dto.ApiDtos.NotificationResponse;
import io.virinchi.springweb.dto.ApiDtos.ReviewRequest;
import io.virinchi.springweb.dto.ApiDtos.ReviewResponse;
import io.virinchi.springweb.dto.ApiDtos.UserResponse;
import io.virinchi.springweb.service.BookingService;
import io.virinchi.springweb.service.NotificationService;
import io.virinchi.springweb.service.ReviewService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/customer")
public class CustomerController {
    private final BookingService bookingService;
    private final ReviewService reviewService;
    private final NotificationService notificationService;

    public CustomerController(BookingService bookingService,
                              ReviewService reviewService,
                              NotificationService notificationService) {
        this.bookingService = bookingService;
        this.reviewService = reviewService;
        this.notificationService = notificationService;
    }

    @GetMapping("/bookings")
    public List<BookingResponse> bookings() {
        return bookingService.customerBookings();
    }

    @PostMapping("/bookings")
    @ResponseStatus(HttpStatus.CREATED)
    public BookingResponse createBooking(@Valid @RequestBody BookingRequest request) {
        return bookingService.createBooking(request);
    }

    @GetMapping("/bookings/{id}")
    public BookingResponse booking(@PathVariable Long id) {
        return bookingService.customerBooking(id);
    }

    @PutMapping("/bookings/{id}/notes")
    public BookingResponse updateNotes(@PathVariable Long id, @Valid @RequestBody BookingNotesRequest request) {
        return bookingService.updateNotes(id, request);
    }

    @PostMapping("/bookings/{id}/cancel")
    public BookingResponse cancel(@PathVariable Long id) {
        return bookingService.cancelBooking(id);
    }

    @GetMapping("/reviews")
    public List<ReviewResponse> reviews() {
        return reviewService.customerReviews();
    }

    @PostMapping("/reviews")
    @ResponseStatus(HttpStatus.CREATED)
    public ReviewResponse createReview(@RequestParam Long bookingId, @Valid @RequestBody ReviewRequest request) {
        return reviewService.createReview(bookingId, request);
    }

    @PutMapping("/reviews/{id}")
    public ReviewResponse updateReview(@PathVariable Long id, @Valid @RequestBody ReviewRequest request) {
        return reviewService.updateReview(id, request);
    }

    @DeleteMapping("/reviews/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteReview(@PathVariable Long id) {
        reviewService.deleteCustomerReview(id);
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

    @PutMapping("/profile")
    public UserResponse updateProfile(@Valid @RequestBody CustomerProfileUpdateRequest request) {
        return bookingService.updateCustomerProfile(request);
    }
}
