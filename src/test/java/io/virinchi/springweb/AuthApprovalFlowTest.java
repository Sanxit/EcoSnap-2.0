package io.virinchi.springweb;

import io.virinchi.springweb.domain.User;
import io.virinchi.springweb.domain.UserRole;
import io.virinchi.springweb.domain.UserStatus;
import io.virinchi.springweb.dto.ApiDtos.AuthResponse;
import io.virinchi.springweb.dto.ApiDtos.LoginRequest;
import io.virinchi.springweb.dto.ApiDtos.PhotographerProfileRequest;
import io.virinchi.springweb.dto.ApiDtos.RegisterRequest;
import io.virinchi.springweb.repository.PhotographerProfileRepository;
import io.virinchi.springweb.repository.*;
import io.virinchi.springweb.service.EmailService;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ActiveProfiles("test")
@SpringBootTest
@AutoConfigureMockMvc
class AuthApprovalFlowTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PhotographerProfileRepository photographerProfileRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private AvailabilitySlotRepository availabilitySlotRepository;

    @Autowired
    private PhotographyPackageRepository photographyPackageRepository;

    @Autowired
    private PortfolioImageRepository portfolioImageRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockitoBean
    private EmailService emailService;

    private RegisterRequest customerRegisterRequest;
    private RegisterRequest photographerRegisterRequest;

    private static RequestPostProcessor csrfCookie() {
        return request -> {
            request.setCookies(new Cookie("XSRF-TOKEN", "0123456789012345678901234567890123456789"));
            request.addHeader("X-XSRF-TOKEN", "0123456789012345678901234567890123456789");
            return request;
        };
    }

    @BeforeEach
    void setUp() {
        reviewRepository.deleteAllInBatch();
        bookingRepository.deleteAllInBatch();
        availabilitySlotRepository.deleteAllInBatch();
        photographyPackageRepository.deleteAllInBatch();
        portfolioImageRepository.deleteAllInBatch();
        notificationRepository.deleteAllInBatch();
        passwordResetTokenRepository.deleteAllInBatch();
        photographerProfileRepository.deleteAllInBatch();
        userRepository.deleteAllInBatch();

        User admin = new User();
        admin.setFullName("Test Administrator");
        admin.setEmail("admin@test.com");
        admin.setPasswordHash(passwordEncoder.encode("AdminPassword123!"));
        admin.setPhoneNumber(null);
        admin.setRole(UserRole.ADMIN);
        admin.setStatus(UserStatus.ACTIVE);
        userRepository.save(admin);

        customerRegisterRequest = new RegisterRequest(
                "John Customer",
                "customer@test.com",
                "Password123!",
                "+1234567890",
                UserRole.CUSTOMER,
                null
        );

        photographerRegisterRequest = new RegisterRequest(
                "Jane Photographer",
                "photographer@test.com",
                "Password123!",
                "+1234567890",
                UserRole.PHOTOGRAPHER,
                new PhotographerProfileRequest(
                        "Professional photographer",
                        "Wedding",
                        "New York",
                        5,
                        new java.math.BigDecimal("150.00"),
                        null,
                        null,
                        24
                )
        );
    }

    @Test
    void publicRegistrationCreatesPendingUserAndSendsRegistrationPendingEmail() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(csrfCookie())
                        .content("""
                                {
                                    "fullName": "John Customer",
                                    "email": "customer@test.com",
                                    "password": "Password123!",
                                    "phoneNumber": "+1234567890",
                                    "role": "CUSTOMER"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.user.id").exists())
                .andExpect(jsonPath("$.user.email").value("customer@test.com"))
                .andExpect(jsonPath("$.user.status").value("PENDING"))
                .andExpect(jsonPath("$.user.role").value("CUSTOMER"));

        Optional<User> savedUser = userRepository.findByEmail("customer@test.com");
        assertThat(savedUser).isPresent();
        assertThat(savedUser.get().getStatus()).isEqualTo(UserStatus.PENDING);

        verify(emailService, times(1)).sendRegistrationPending(any(User.class));
    }

    @Test
    void publicRegistrationForPhotographerCreatesPendingUserAndProfileAndSendsEmail() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(csrfCookie())
                        .content("""
                                {
                                    "fullName": "Jane Photographer",
                                    "email": "photographer@test.com",
                                    "password": "Password123!",
                                    "phoneNumber": "+1234567890",
                                    "role": "PHOTOGRAPHER",
                                    "profile": {
                                        "bio": "Professional photographer",
                                        "specialization": "Wedding",
                                        "location": "New York",
                                        "experienceYears": 5,
                                        "hourlyRate": 150.00,
                                        "responseHours": 24
                                    }
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.user.id").exists())
                .andExpect(jsonPath("$.user.email").value("photographer@test.com"))
                .andExpect(jsonPath("$.user.status").value("PENDING"))
                .andExpect(jsonPath("$.user.role").value("PHOTOGRAPHER"))
                .andExpect(jsonPath("$.user.profile.specialization").value("Wedding"))
                .andExpect(jsonPath("$.user.profile.location").value("New York"));

        Optional<User> savedUser = userRepository.findByEmail("photographer@test.com");
        assertThat(savedUser).isPresent();
        assertThat(savedUser.get().getStatus()).isEqualTo(UserStatus.PENDING);
        assertThat(savedUser.get().getPhotographerProfile()).isNotNull();

        verify(emailService, times(1)).sendRegistrationPending(any(User.class));
    }

    @Test
    void pendingLoginIsRejectedWith403AndNoSession() throws Exception {
        // First register a user (will be PENDING)
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(csrfCookie())
                        .content("""
                                {
                                    "fullName": "John Customer",
                                    "email": "customer@test.com",
                                    "password": "Password123!",
                                    "phoneNumber": "+1234567890",
                                    "role": "CUSTOMER"
                                }
                                """))
                .andExpect(status().isCreated());

        // Now try to login with the pending user
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(csrfCookie())
                        .content("""
                                {
                                    "email": "customer@test.com",
                                    "password": "Password123!"
                                }
                                """))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Account is pending administrator approval"));

        // Verify no email was sent for approval (still pending)
        verify(emailService, never()).sendApproval(any(User.class));
    }

    @Test
    void activeLoginSucceedsAndReturnsAuthResponse() throws Exception {
        // Register user
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(csrfCookie())
                        .content("""
                                {
                                    "fullName": "John Customer",
                                    "email": "customer@test.com",
                                    "password": "Password123!",
                                    "phoneNumber": "+1234567890",
                                    "role": "CUSTOMER"
                                }
                                """))
                .andExpect(status().isCreated());

        // Activate the user directly in database
        User user = userRepository.findByEmail("customer@test.com").orElseThrow();
        user.setStatus(UserStatus.ACTIVE);
        userRepository.save(user);

        // Login should succeed
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(csrfCookie())
                        .content("""
                                {
                                    "email": "customer@test.com",
                                    "password": "Password123!"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.id").exists())
                .andExpect(jsonPath("$.user.email").value("customer@test.com"))
                .andExpect(jsonPath("$.user.status").value("ACTIVE"))
                .andReturn();

        // Verify response structure
        String responseBody = result.getResponse().getContentAsString();
        assertThat(responseBody).contains("\"user\":");
        assertThat(responseBody).contains("\"id\":");
        assertThat(responseBody).contains("\"email\":");
        assertThat(responseBody).contains("\"status\":\"ACTIVE\"");

        // Verify no approval email sent (user was activated directly, not via admin)
        verify(emailService, never()).sendApproval(any(User.class));
    }

    @Test
    @WithMockUser(username = "admin@test.com", roles = {"ADMIN"})
    void adminTransitionPendingToActiveSendsApprovalEmail() throws Exception {
        // Register user
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(csrfCookie())
                        .content("""
                                {
                                    "fullName": "John Customer",
                                    "email": "customer@test.com",
                                    "password": "Password123!",
                                    "phoneNumber": "+1234567890",
                                    "role": "CUSTOMER"
                                }
                                """))
                .andExpect(status().isCreated());

        User user = userRepository.findByEmail("customer@test.com").orElseThrow();
        Long userId = user.getId();
        assertThat(user.getStatus()).isEqualTo(UserStatus.PENDING);

        // Admin updates status from PENDING to ACTIVE
        mockMvc.perform(patch("/api/admin/users/{id}/status", userId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(csrfCookie())
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("admin@test.com").roles("ADMIN"))
                        .content("""
                                {
                                    "status": "ACTIVE"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(userId))
                .andExpect(jsonPath("$.status").value("ACTIVE"));

        // Verify approval email was sent
        verify(emailService, times(1)).sendApproval(any(User.class));

        // Verify user is now ACTIVE in database
        User updatedUser = userRepository.findById(userId).orElseThrow();
        assertThat(updatedUser.getStatus()).isEqualTo(UserStatus.ACTIVE);
    }

    @Test
    void authMeReturnsNullUserForUnauthenticated() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user").doesNotExist());
    }

    @Test
    void authMeReturnsNullUserForPendingUser() throws Exception {
        // Register user (PENDING)
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(csrfCookie())
                        .content("""
                                {
                                    "fullName": "John Customer",
                                    "email": "customer@test.com",
                                    "password": "Password123!",
                                    "phoneNumber": "+1234567890",
                                    "role": "CUSTOMER"
                                }
                                """))
                .andExpect(status().isCreated());

        // Try to login (will fail with 403)
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(csrfCookie())
                        .content("""
                                {
                                    "email": "customer@test.com",
                                    "password": "Password123!"
                                }
                                """))
                .andExpect(status().isForbidden());

        // /me should return null user for pending (since login failed, no session)
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user").doesNotExist());
    }

    @Test
    void authMeReturnsUserForActiveAuthenticatedUser() throws Exception {
        // Register user
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(csrfCookie())
                        .content("""
                                {
                                    "fullName": "John Customer",
                                    "email": "customer@test.com",
                                    "password": "Password123!",
                                    "phoneNumber": "+1234567890",
                                    "role": "CUSTOMER"
                                }
                                """))
                .andExpect(status().isCreated());

        // Activate user
        User user = userRepository.findByEmail("customer@test.com").orElseThrow();
        user.setStatus(UserStatus.ACTIVE);
        userRepository.save(user);

        // Login
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(csrfCookie())
                        .content("""
                                {
                                    "email": "customer@test.com",
                                    "password": "Password123!"
                                }
                                """))
                .andExpect(status().isOk())
                .andReturn();

        // Pass session to /me
        var session = (org.springframework.mock.web.MockHttpSession) loginResult.getRequest().getSession();
        var req = get("/api/auth/me");
        if (session != null) {
            req.session(session);
        }
        String sessionCookie = loginResult.getResponse().getHeader("Set-Cookie");
        if (sessionCookie != null) {
            req.header("Cookie", sessionCookie);
        }

        // /me should return user for active authenticated user
        mockMvc.perform(req)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.id").exists())
                .andExpect(jsonPath("$.user.email").value("customer@test.com"))
                .andExpect(jsonPath("$.user.status").value("ACTIVE"));
    }

    @Test
    void authMeReturnsNullForActiveUserWithoutSession() throws Exception {
        // Register and activate user
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(csrfCookie())
                        .content("""
                                {
                                    "fullName": "John Customer",
                                    "email": "customer@test.com",
                                    "password": "Password123!",
                                    "phoneNumber": "+1234567890",
                                    "role": "CUSTOMER"
                                }
                                """))
                .andExpect(status().isCreated());

        User user = userRepository.findByEmail("customer@test.com").orElseThrow();
        user.setStatus(UserStatus.ACTIVE);
        userRepository.save(user);

        // Without logging in, /me should return null user
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user").doesNotExist());
    }

    @Test
    void suspendedUserLoginRejected() throws Exception {
        // Register user
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(csrfCookie())
                        .content("""
                                {
                                    "fullName": "John Customer",
                                    "email": "customer@test.com",
                                    "password": "Password123!",
                                    "phoneNumber": "+1234567890",
                                    "role": "CUSTOMER"
                                }
                                """))
                .andExpect(status().isCreated());

        // Set user to SUSPENDED
        User user = userRepository.findByEmail("customer@test.com").orElseThrow();
        user.setStatus(UserStatus.SUSPENDED);
        userRepository.save(user);

        // Login should be rejected
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(csrfCookie())
                        .content("""
                                {
                                    "email": "customer@test.com",
                                    "password": "Password123!"
                                }
                                """))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Account is not active"));
    }

    @Test
    void authMeReturnsNullForSuspendedUserEvenWithSession() throws Exception {
        // Register user
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(csrfCookie())
                        .content("""
                                {
                                    "fullName": "John Customer",
                                    "email": "customer@test.com",
                                    "password": "Password123!",
                                    "phoneNumber": "+1234567890",
                                    "role": "CUSTOMER"
                                }
                                """))
                .andExpect(status().isCreated());

        // Activate then suspend
        User user = userRepository.findByEmail("customer@test.com").orElseThrow();
        user.setStatus(UserStatus.ACTIVE);
        userRepository.save(user);

        // Login
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(csrfCookie())
                        .content("""
                                {
                                    "email": "customer@test.com",
                                    "password": "Password123!"
                                }
                                """))
                .andExpect(status().isOk())
                .andReturn();

        String sessionCookie = loginResult.getResponse().getHeader("Set-Cookie");

        // Suspend user
        user.setStatus(UserStatus.SUSPENDED);
        userRepository.save(user);

        // /me should return null user for suspended even with session
        mockMvc.perform(get("/api/auth/me")
                        .header("Cookie", sessionCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user").doesNotExist());
    }
}