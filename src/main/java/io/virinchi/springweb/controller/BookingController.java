package io.virinchi.springweb.controller;

import io.virinchi.springweb.domain.BookingStatus;
import io.virinchi.springweb.dto.ApiDtos.BookingDeclineRequest;
import io.virinchi.springweb.dto.ApiDtos.BookingResponse;
import io.virinchi.springweb.dto.ApiDtos.BookingStatusRequest;
import io.virinchi.springweb.service.BookingService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Photographer-facing booking lifecycle endpoints.
 *
 * <ul>
 *   <li>PATCH /api/bookings/{id}/confirm  → status CONFIRMED (marks the reserved slot as booked)</li>
 *   <li>PATCH /api/bookings/{id}/decline  → status DECLINED (reason required)</li>
 *   <li>PATCH /api/bookings/{id}/complete → status COMPLETED (only allowed once the event date has passed)</li>
 * </ul>
 *
 * Ownership and state-transition rules are enforced in {@link BookingService#photographerBookingAction}.
 */
@RestController
@RequestMapping("/api/bookings")
public class BookingController {
    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PatchMapping("/{id}/confirm")
    public BookingResponse confirm(@PathVariable Long id) {
        return bookingService.photographerBookingAction(id,
                new BookingStatusRequest(BookingStatus.CONFIRMED, null));
    }

    @PatchMapping("/{id}/decline")
    public BookingResponse decline(@PathVariable Long id,
                                   @Valid @RequestBody BookingDeclineRequest request) {
        return bookingService.photographerBookingAction(id,
                new BookingStatusRequest(BookingStatus.DECLINED, request.reason()));
    }

    @PatchMapping("/{id}/complete")
    public BookingResponse complete(@PathVariable Long id) {
        return bookingService.photographerBookingAction(id,
                new BookingStatusRequest(BookingStatus.COMPLETED, null));
    }
}