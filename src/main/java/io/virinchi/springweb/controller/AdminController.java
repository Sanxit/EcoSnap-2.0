package io.virinchi.springweb.controller;

import io.virinchi.springweb.dto.ApiDtos.ContactInquiryResponse;
import io.virinchi.springweb.dto.ApiDtos.AdminStatsResponse;
import io.virinchi.springweb.dto.ApiDtos.PhotographerAdminResponse;
import io.virinchi.springweb.dto.ApiDtos.UserAdminResponse;
import io.virinchi.springweb.service.AdminService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/stats")
    public AdminStatsResponse stats() {
        return adminService.stats();
    }

    @GetMapping("/users")
    public List<UserAdminResponse> users() {
        return adminService.users();
    }

    @GetMapping("/photographers")
    public List<PhotographerAdminResponse> photographers() {
        return adminService.photographers();
    }

    @GetMapping("/bookings")
    public List<io.virinchi.springweb.dto.ApiDtos.BookingResponse> bookings(@RequestParam(required = false) String status) {
        return adminService.adminBookings(status);
    }

    @PatchMapping("/bookings/{id}/status")
    public io.virinchi.springweb.dto.ApiDtos.BookingResponse adminBookingAction(
            @PathVariable Long id, @Valid @RequestBody io.virinchi.springweb.dto.ApiDtos.BookingStatusRequest request) {
        return adminService.adminBookingAction(id, request);
    }

    @GetMapping("/reviews")
    public List<io.virinchi.springweb.dto.ApiDtos.ReviewResponse> reviews(@RequestParam(required = false) String search) {
        return adminService.adminReviews(search);
    }

    @DeleteMapping("/reviews/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteReview(@PathVariable Long id) {
        adminService.adminDeleteReview(id);
    }

    @GetMapping("/inquiries")
    public List<io.virinchi.springweb.dto.ApiDtos.ContactInquiryResponse> inquiries(
            @RequestParam(required = false) String status) {
        return adminService.inquiries(status);
    }

    @PatchMapping("/inquiries/{id}/status")
    public ContactInquiryResponse updateInquiryStatus(
            @PathVariable Long id, @Valid @RequestBody io.virinchi.springweb.dto.ApiDtos.InquiryStatusRequest request) {
        return adminService.updateInquiryStatus(id, request.status());
    }

    @PostMapping("/users")
    @ResponseStatus(HttpStatus.CREATED)
    public UserAdminResponse createUser(@Valid @RequestBody io.virinchi.springweb.dto.ApiDtos.AdminCreateUserRequest request) {
        return adminService.createUser(request);
    }

    @PatchMapping("/users/{id}/status")
    public UserAdminResponse updateUserStatus(@PathVariable Long id, @Valid @RequestBody MessageRequest request) {
        return adminService.updateUserStatus(id, request.status());
    }

    @PutMapping("/photographers/{id}")
    public PhotographerAdminResponse updatePhotographer(
            @PathVariable Long id, @Valid @RequestBody io.virinchi.springweb.dto.ApiDtos.PhotographerProfileRequest request) {
        return adminService.updatePhotographer(id, request);
    }

    @PatchMapping("/photographers/{id}/verify")
    public PhotographerAdminResponse verifyPhotographer(@PathVariable Long id) {
        return adminService.verifyPhotographer(id);
    }

    @PostMapping("/notices")
    @ResponseStatus(HttpStatus.CREATED)
    public void postNotice(@Valid @RequestBody io.virinchi.springweb.dto.ApiDtos.AdminNoticeRequest request) {
        adminService.broadcastNotice(request);
    }

    @DeleteMapping("/users/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteUser(@PathVariable Long id) {
        adminService.deleteUser(id);
    }

    @DeleteMapping("/photographers/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePhotographer(@PathVariable Long id) {
        adminService.deletePhotographer(id);
    }

    public record MessageRequest(@NotBlank String status) {}
}