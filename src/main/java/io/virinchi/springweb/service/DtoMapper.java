package io.virinchi.springweb.service;

import io.virinchi.springweb.domain.Booking;
import io.virinchi.springweb.domain.PhotographerProfile;
import io.virinchi.springweb.domain.PhotographyPackage;
import io.virinchi.springweb.domain.PortfolioImage;
import io.virinchi.springweb.domain.Review;
import io.virinchi.springweb.domain.User;
import io.virinchi.springweb.dto.ApiDtos.BookingResponse;
import io.virinchi.springweb.dto.ApiDtos.PhotographerProfileResponse;
import io.virinchi.springweb.dto.ApiDtos.PhotographyPackageResponse;
import io.virinchi.springweb.dto.ApiDtos.PortfolioImageResponse;
import io.virinchi.springweb.dto.ApiDtos.ReviewResponse;
import io.virinchi.springweb.dto.ApiDtos.UserResponse;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class DtoMapper {
    public UserResponse toUserResponse(User user, PhotographerProfile profile) {
        return new UserResponse(
                user.getId(), user.getFullName(), user.getEmail(), user.getPhoneNumber(),
                user.getRole(), user.getStatus(), profile == null ? null : toProfileResponse(profile, List.of(), List.of(), 0, 0));
    }

    public PhotographerProfileResponse toProfileResponse(PhotographerProfile profile,
                                                          List<PortfolioImage> portfolio,
                                                          List<PhotographyPackage> packages,
                                                          double rating,
                                                          long reviewCount) {
        List<PortfolioImageResponse> portfolioResponses = portfolio.stream()
                .sorted(Comparator.comparingInt(PortfolioImage::getSortOrder).thenComparing(PortfolioImage::getId))
                .map(this::toPortfolioResponse).toList();
        List<PhotographyPackageResponse> packageResponses = packages.stream()
                .sorted(Comparator.comparing(PhotographyPackage::getPrice).thenComparing(PhotographyPackage::getId))
                .map(this::toPackageResponse).toList();
        User owner = profile.getUser();
        return new PhotographerProfileResponse(
                profile.getId(), owner == null ? null : owner.getId(),
                owner == null ? null : owner.getFullName(), profile.getBio(),
                profile.getSpecialization(), profile.getLocation(), profile.getExperienceYears(),
                profile.getHourlyRate(), profile.getAvatarUrl(), profile.getCoverImageUrl(),
                profile.isVerified(), profile.getResponseHours(), rating, reviewCount,
                portfolioResponses, packageResponses);
    }

    public PhotographerProfileResponse toProfileResponse(PhotographerProfile profile,
                                                          List<PortfolioImage> portfolio,
                                                          List<PhotographyPackage> packages,
                                                          List<Review> reviews) {
        double rating = reviews.isEmpty() ? 0 : reviews.stream().mapToInt(Review::getRating).average().orElse(0);
        return toProfileResponse(profile, portfolio, packages, rating, reviews.size());
    }

    public PortfolioImageResponse toPortfolioResponse(PortfolioImage image) {
        return new PortfolioImageResponse(image.getId(), image.getImageUrl(), image.getCaption(),
                image.getCategory(), image.getSortOrder());
    }

    public PhotographyPackageResponse toPackageResponse(PhotographyPackage pkg) {
        return new PhotographyPackageResponse(pkg.getId(), pkg.getName(), pkg.getCategory(),
                pkg.getDescription(), pkg.getPrice(), pkg.getDurationHours(), pkg.isActive());
    }

    public BookingResponse toBookingResponse(Booking booking) {
        PhotographyPackage pkg = booking.getPhotographyPackage();
        User customer = booking.getCustomer();
        PhotographerProfile photographer = booking.getPhotographer();
        return new BookingResponse(
                booking.getId(), booking.getBookingNumber(), photographer.getId(),
                photographer.getUser() == null ? "Photographer" : photographer.getUser().getFullName(),
                customer.getId(), customer.getFullName(), pkg == null ? null : pkg.getId(),
                pkg == null ? null : pkg.getName(), booking.getEventType(), booking.getEventDate(),
                booking.getTimeSlot(), booking.getLocation(), booking.getNotes(), booking.getAmount(),
                booking.getStatus(), booking.getDeclineReason(), booking.getCreatedAt(), booking.getUpdatedAt());
    }

    public ReviewResponse toReviewResponse(Review review) {
        User customer = review.getCustomer();
        PhotographerProfile photographer = review.getPhotographer();
        return new ReviewResponse(review.getId(), review.getBooking().getId(), photographer.getId(),
                photographer.getUser() == null ? "Photographer" : photographer.getUser().getFullName(),
                customer.getId(), customer.getFullName(), review.getRating(), review.getComment(),
                review.getCreatedAt());
    }
}
