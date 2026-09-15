package io.virinchi.springweb.dto;

import io.virinchi.springweb.domain.BookingStatus;
import io.virinchi.springweb.domain.InquiryStatus;
import io.virinchi.springweb.domain.NotificationType;
import io.virinchi.springweb.domain.TimeSlot;
import io.virinchi.springweb.domain.UserRole;
import io.virinchi.springweb.domain.UserStatus;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public final class ApiDtos {
    private ApiDtos() {
    }

    public record LoginRequest(
            @NotBlank @Email String email,
            @NotBlank String password) {
    }

    public record PhotographerProfileRequest(
            String bio,
            @NotBlank String specialization,
            @NotBlank String location,
            @DecimalMin("0") int experienceYears,
            @DecimalMin("0") BigDecimal hourlyRate,
            String avatarUrl,
            String coverImageUrl,
            Integer responseHours) {
    }

    public record RegisterRequest(
            @NotBlank @Size(min = 2, max = 160) String fullName,
            @NotBlank @Email String email,
            @NotBlank @Size(min = 8, max = 72) String password,
            String phoneNumber,
            @NotNull UserRole role,
            PhotographerProfileRequest profile) {
    }

    public record AuthResponse(UserResponse user) {
    }

    public record UserResponse(
            Long id,
            String fullName,
            String email,
            String phoneNumber,
            UserRole role,
            UserStatus status,
            PhotographerProfileResponse profile) {
    }

    public record MessageResponse(String message) {
    }

    public record CsrfResponse(String token, String headerName, String cookieName) {
    }

    public record ForgotPasswordRequest(@NotBlank @Email String email) {
    }

    public record ResetPasswordRequest(
            @NotBlank String token,
            @NotBlank @Size(min = 8, max = 72) String password) {
    }

    public record PasswordChangeRequest(
            @NotBlank String currentPassword,
            @NotBlank @Size(min = 8, max = 72) String newPassword) {
    }

    public record PortfolioImageRequest(
            @NotBlank @Size(max = 2000) String imageUrl,
            @Size(max = 255) String caption,
            @Size(max = 50) String category,
            @DecimalMin("0") int sortOrder) {
    }

    public record PhotographyPackageRequest(
            @NotBlank @Size(max = 160) String name,
            @NotBlank @Size(max = 50) String category,
            @Size(max = 2000) String description,
            @NotNull @DecimalMin("0") BigDecimal price,
            @NotNull @DecimalMin("1") int durationHours,
            boolean active) {
    }

    public record AvailabilitySlotRequest(
            @NotNull LocalDate date,
            @NotNull TimeSlot timeSlot) {
    }

    public record PhotographerProfileResponse(
            Long id,
            Long userId,
            String ownerName,
            String bio,
            String specialization,
            String location,
            int experienceYears,
            BigDecimal hourlyRate,
            String avatarUrl,
            String coverImageUrl,
            boolean verified,
            int responseHours,
            double rating,
            long reviewCount,
            List<PortfolioImageResponse> portfolio,
            List<PhotographyPackageResponse> packages) {
    }

    public record PortfolioImageResponse(
            Long id,
            String imageUrl,
            String caption,
            String category,
            int sortOrder) {
    }

    public record PhotographyPackageResponse(
            Long id,
            String name,
            String category,
            String description,
            BigDecimal price,
            int durationHours,
            boolean active) {
    }

    public record AvailabilitySlotResponse(
            Long id,
            LocalDate date,
            TimeSlot timeSlot,
            boolean booked) {
    }

    public record BookingRequest(
            @NotNull Long photographerProfileId,
            Long packageId,
            @NotBlank @Size(max = 50) String eventType,
            @NotNull LocalDate eventDate,
            TimeSlot timeSlot,
            @NotBlank @Size(max = 255) String location,
            @Size(max = 5000) String notes) {
    }

    public record BookingStatusRequest(
            @NotNull BookingStatus status,
            @Size(max = 2000) String reason) {
    }

    public record BookingDeclineRequest(
            @NotBlank @Size(max = 2000) String reason) {
    }

    public record BookingNotesRequest(@Size(max = 5000) String notes) {
    }

    public record UserUpdateRequest(
            @NotBlank @Size(max = 160) String fullName,
            @NotBlank @Email String email,
            String phoneNumber,
            @NotNull UserRole role,
            @NotNull UserStatus status) {
    }

    public record InquiryStatusRequest(@NotNull InquiryStatus status) {
    }

    public record BookingResponse(
            Long id,
            String bookingNumber,
            Long photographerProfileId,
            String photographerName,
            Long customerId,
            String customerName,
            Long packageId,
            String packageName,
            String eventType,
            LocalDate eventDate,
            TimeSlot timeSlot,
            String location,
            String notes,
            BigDecimal amount,
            BookingStatus status,
            String declineReason,
            Instant createdAt,
            Instant updatedAt) {
    }

    public record ReviewRequest(
            @NotNull @DecimalMin("1") @DecimalMax("5") int rating,
            @NotBlank @Size(max = 5000) String comment) {
    }

    public record ReviewResponse(
            Long id,
            Long bookingId,
            Long photographerProfileId,
            String photographerName,
            Long customerId,
            String customerName,
            int rating,
            String comment,
            Instant createdAt) {
    }

    public record NotificationResponse(
            Long id,
            String message,
            NotificationType type,
            boolean read,
            Instant createdAt) {
    }

    public record ContactInquiryRequest(
            @NotBlank @Size(max = 160) String name,
            @NotBlank @Email String email,
            @NotBlank @Size(max = 255) String subject,
            @NotBlank @Size(max = 5000) String message) {
    }

    public record ContactInquiryResponse(
            Long id,
            String name,
            String email,
            String subject,
            String message,
            InquiryStatus status,
            Instant createdAt) {
    }

    public record AdminStatsResponse(
            long users,
            long photographers,
            long bookings,
            long reviews,
            long inquiries,
            BigDecimal completedRevenue) {
    }

    public record PhotographerAdminResponse(
            Long id,
            Long userId,
            String ownerName,
            String email,
            String specialization,
            String location,
            int experienceYears,
            BigDecimal hourlyRate,
            boolean verified,
            double rating,
            long reviewCount,
            long bookingCount) {
    }

    public record UserAdminResponse(
            Long id,
            String fullName,
            String email,
            String phoneNumber,
            UserRole role,
            UserStatus status,
            Instant createdAt) {
    }

    public record PublicStatsResponse(
            long photographersCount,
            long bookingsCount,
            double averageRating,
            int districtsCount,
            BigDecimal minPackagePrice) {
    }

    public record AdminCreateUserRequest(
            @NotBlank @Size(min = 2, max = 160) String fullName,
            @NotBlank @Email String email,
            @NotBlank @Size(min = 6, max = 72) String password,
            String phoneNumber,
            @NotNull UserRole role,
            @NotNull UserStatus status) {
    }

    public record AdminNoticeRequest(
            @NotBlank @Size(max = 255) String title,
            @NotBlank @Size(max = 5000) String message,
            String targetRole) {
    }

    public record CustomerProfileUpdateRequest(
            @NotBlank @Size(max = 160) String fullName,
            String phoneNumber) {
    }
}
