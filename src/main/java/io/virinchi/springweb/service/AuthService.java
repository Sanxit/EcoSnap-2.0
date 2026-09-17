package io.virinchi.springweb.service;

import io.virinchi.springweb.domain.PasswordResetToken;
import io.virinchi.springweb.domain.PhotographerProfile;
import io.virinchi.springweb.domain.User;
import io.virinchi.springweb.domain.UserRole;
import io.virinchi.springweb.domain.UserStatus;
import io.virinchi.springweb.dto.ApiDtos.AuthResponse;
import io.virinchi.springweb.dto.ApiDtos.ForgotPasswordRequest;
import io.virinchi.springweb.dto.ApiDtos.LoginRequest;
import io.virinchi.springweb.dto.ApiDtos.PasswordChangeRequest;
import io.virinchi.springweb.dto.ApiDtos.PhotographerProfileRequest;
import io.virinchi.springweb.dto.ApiDtos.RegisterRequest;
import io.virinchi.springweb.dto.ApiDtos.ResetPasswordRequest;
import io.virinchi.springweb.dto.ApiDtos.UserResponse;
import io.virinchi.springweb.exception.ConflictException;
import io.virinchi.springweb.exception.NotFoundException;
import io.virinchi.springweb.repository.PasswordResetTokenRepository;
import io.virinchi.springweb.repository.PhotographerProfileRepository;
import io.virinchi.springweb.repository.UserRepository;
import io.virinchi.springweb.service.EmailService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.HexFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private final UserRepository userRepository;
    private final PhotographerProfileRepository profileRepository;
    private final PasswordResetTokenRepository resetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;
    private final DtoMapper mapper;

    public AuthService(UserRepository userRepository,
                       PhotographerProfileRepository profileRepository,
                       PasswordResetTokenRepository resetTokenRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       EmailService emailService,
                       DtoMapper mapper) {
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
        this.resetTokenRepository = resetTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.emailService = emailService;
        this.mapper = mapper;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.email().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new ConflictException("An account with this email already exists");
        }
        if (request.role() != UserRole.CUSTOMER && request.role() != UserRole.PHOTOGRAPHER) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Public registration is limited to clients and photographers");
        }
        User user = new User();
        user.setFullName(request.fullName().trim());
        user.setEmail(email);
        user.setPhoneNumber(blankToNull(request.phoneNumber()));
        user.setRole(request.role());
        user.setStatus(UserStatus.PENDING);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        userRepository.save(user);

        PhotographerProfile profile = null;
        if (request.role() == UserRole.PHOTOGRAPHER) {
            PhotographerProfileRequest p = request.profile();
            if (p == null || blank(p.specialization()) || blank(p.location())) {
                throw new IllegalArgumentException("Photographer specialization and location are required");
            }
            profile = new PhotographerProfile();
            profile.setUser(user);
            profile.setBio(blankToNull(p.bio()));
            profile.setSpecialization(p.specialization().trim());
            profile.setLocation(p.location().trim());
            profile.setExperienceYears(p.experienceYears());
            profile.setHourlyRate(p.hourlyRate());
            profile.setAvatarUrl(blankToNull(p.avatarUrl()));
            profile.setCoverImageUrl(blankToNull(p.coverImageUrl()));
            profile.setResponseHours(p.responseHours() == null ? 24 : p.responseHours());
            profileRepository.save(profile);
        }
        user.setPhotographerProfile(profile);
        sendAfterCommit(() -> emailService.sendRegistrationPending(user));
        return new AuthResponse(mapper.toUserResponse(user, profile));
    }

    @Transactional
    public AuthResponse login(LoginRequest request, jakarta.servlet.http.HttpServletRequest httpRequest, jakarta.servlet.http.HttpServletResponse httpResponse) {
        String email = request.email().trim().toLowerCase();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new org.springframework.security.authentication.BadCredentialsException("Invalid credentials"));
        if (user.getStatus() == UserStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Account is pending administrator approval");
        }
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Account is not active");
        }

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.password()));
        org.springframework.security.core.context.SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);

        if (httpRequest != null) {
            jakarta.servlet.http.HttpSession session = httpRequest.getSession(true);
            session.setAttribute(org.springframework.security.web.context.HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, context);
        }

        PhotographerProfile profile = profileRepository.findByUserId(user.getId()).orElse(null);
        return new AuthResponse(mapper.toUserResponse(user, profile));
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        return login(request, null, null);
    }

    public UserResponse me() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || authentication.getPrincipal().equals("anonymousUser")) {
            return null;
        }
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        if (user.getStatus() != UserStatus.ACTIVE) {
            return null;
        }
        PhotographerProfile profile = profileRepository.findByUserId(user.getId()).orElse(null);
        return mapper.toUserResponse(user, profile);
    }

    @Transactional
    public void logout(HttpServletRequest request) {
        SecurityContextHolder.clearContext();
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
    }

    @Transactional
    public void changePassword(PasswordChangeRequest request) {
        User user = currentUser();
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST, "Current password is incorrect");
        }
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.email().trim().toLowerCase()).orElse(null);
        if (user == null) {
            return;
        }
        String token = HexFormat.of().formatHex(randomBytes(32));
        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setUser(user);
        resetToken.setToken(token);
        resetToken.setExpiresAt(Instant.now().plusSeconds(3600));
        resetTokenRepository.save(resetToken);
        sendAfterCommit(() -> emailService.sendPasswordReset(user, token));
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        PasswordResetToken resetToken = resetTokenRepository.findByToken(request.token())
                .orElseThrow(() -> new NotFoundException("Password reset token is invalid"));
        if (resetToken.getUsedAt() != null || resetToken.getExpiresAt().isBefore(Instant.now())) {
            throw new IllegalArgumentException("Password reset token has expired");
        }
        resetToken.getUser().setPasswordHash(passwordEncoder.encode(request.password()));
        resetToken.setUsedAt(Instant.now());
        userRepository.save(resetToken.getUser());
    }

    private void sendAfterCommit(Runnable action) {
        if (TransactionSynchronizationManager.isActualTransactionActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    action.run();
                }
            });
        } else {
            action.run();
        }
    }

    private User currentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(org.springframework.http.HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return userRepository.findByEmail(authentication.getName()).orElseThrow();
    }

    private byte[] randomBytes(int size) {
        byte[] bytes = new byte[size];
        SECURE_RANDOM.nextBytes(bytes);
        return bytes;
    }

    private String blankToNull(String value) {
        return blank(value) ? null : value.trim();
    }

    private boolean blank(String value) {
        return value == null || value.isBlank();
    }
}
