package io.virinchi.springweb.service;

import io.virinchi.springweb.domain.Booking;
import io.virinchi.springweb.domain.BookingStatus;
import io.virinchi.springweb.domain.PhotographerProfile;
import io.virinchi.springweb.domain.Review;
import io.virinchi.springweb.domain.User;
import io.virinchi.springweb.dto.ApiDtos.ReviewRequest;
import io.virinchi.springweb.dto.ApiDtos.ReviewResponse;
import io.virinchi.springweb.exception.ConflictException;
import io.virinchi.springweb.exception.NotFoundException;
import io.virinchi.springweb.repository.BookingRepository;
import io.virinchi.springweb.repository.PhotographerProfileRepository;
import io.virinchi.springweb.repository.ReviewRepository;
import io.virinchi.springweb.repository.UserRepository;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReviewService {
    private final ReviewRepository reviewRepository;
    private final BookingRepository bookingRepository;
    private final PhotographerProfileRepository profileRepository;
    private final UserRepository userRepository;
    private final DtoMapper mapper;

    public ReviewService(ReviewRepository reviewRepository,
                         BookingRepository bookingRepository,
                         PhotographerProfileRepository profileRepository,
                         UserRepository userRepository,
                         DtoMapper mapper) {
        this.reviewRepository = reviewRepository;
        this.bookingRepository = bookingRepository;
        this.profileRepository = profileRepository;
        this.userRepository = userRepository;
        this.mapper = mapper;
    }

    public List<ReviewResponse> customerReviews() {
        return reviewRepository.findByCustomerIdOrderByCreatedAtDesc(currentUser().getId()).stream()
                .map(mapper::toReviewResponse).toList();
    }

    public List<ReviewResponse> photographerReviews() {
        return reviewRepository.findByPhotographerIdOrderByCreatedAtDesc(ownProfileId()).stream()
                .map(mapper::toReviewResponse).toList();
    }

    public List<ReviewResponse> publicReviews(Long profileId) {
        profileRepository.findById(profileId).orElseThrow(() -> new NotFoundException("Photographer profile not found"));
        return reviewRepository.findByPhotographerIdOrderByCreatedAtDesc(profileId).stream()
                .map(mapper::toReviewResponse).toList();
    }

    public List<ReviewResponse> allPublicReviews() {
        return reviewRepository.findAll().stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .limit(10)
                .map(mapper::toReviewResponse).toList();
    }

    public List<ReviewResponse> adminReviews(String search) {
        String term = search == null ? null : search.trim().toLowerCase();
        return reviewRepository.findAll().stream()
                .filter(review -> term == null || review.getCustomer().getFullName().toLowerCase().contains(term)
                        || review.getPhotographer().getUser().getFullName().toLowerCase().contains(term))
                .map(mapper::toReviewResponse).toList();
    }

    @Transactional
    public ReviewResponse createReview(Long bookingId, ReviewRequest request) {
        User customer = currentUser();
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new NotFoundException("Booking not found"));
        if (!booking.getCustomer().getId().equals(customer.getId())) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN, "Booking belongs to another customer");
        }
        if (booking.getStatus() != BookingStatus.COMPLETED) {
            throw new ConflictException("Only completed bookings can be reviewed");
        }
        if (reviewRepository.findByBookingId(bookingId).isPresent()) {
            throw new ConflictException("This booking already has a review");
        }
        Review review = new Review();
        review.setBooking(booking);
        review.setCustomer(customer);
        review.setPhotographer(booking.getPhotographer());
        review.setRating(request.rating());
        review.setComment(request.comment().trim());
        reviewRepository.save(review);
        return mapper.toReviewResponse(review);
    }

    @Transactional
    public ReviewResponse updateReview(Long id, ReviewRequest request) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Review not found"));
        if (!review.getCustomer().getId().equals(currentUser().getId())) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN, "Review belongs to another customer");
        }
        review.setRating(request.rating());
        review.setComment(request.comment().trim());
        reviewRepository.save(review);
        return mapper.toReviewResponse(review);
    }

    @Transactional
    public void deleteCustomerReview(Long id) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Review not found"));
        if (!review.getCustomer().getId().equals(currentUser().getId())) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN, "Review belongs to another customer");
        }
        reviewRepository.delete(review);
    }

    @Transactional
    public void adminDeleteReview(Long id) {
        reviewRepository.findById(id).orElseThrow(() -> new NotFoundException("Review not found"));
        reviewRepository.deleteById(id);
    }

    private Long ownProfileId() {
        User user = currentUser();
        return profileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new NotFoundException("Photographer profile not found"))
                .getId();
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
}
