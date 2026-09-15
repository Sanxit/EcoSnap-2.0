package io.virinchi.springweb.controller;

import io.virinchi.springweb.dto.ApiDtos.AuthResponse;
import io.virinchi.springweb.dto.ApiDtos.CsrfResponse;
import io.virinchi.springweb.dto.ApiDtos.ForgotPasswordRequest;
import io.virinchi.springweb.dto.ApiDtos.LoginRequest;
import io.virinchi.springweb.dto.ApiDtos.MessageResponse;
import io.virinchi.springweb.dto.ApiDtos.PasswordChangeRequest;
import io.virinchi.springweb.dto.ApiDtos.RegisterRequest;
import io.virinchi.springweb.dto.ApiDtos.ResetPasswordRequest;
import io.virinchi.springweb.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request, jakarta.servlet.http.HttpServletRequest httpRequest, jakarta.servlet.http.HttpServletResponse httpResponse) {
        return authService.login(request, httpRequest, httpResponse);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        authService.logout(request);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public AuthResponse me() {
        return new AuthResponse(authService.me());
    }

    @PostMapping("/change-password")
    public MessageResponse changePassword(@Valid @RequestBody PasswordChangeRequest request) {
        authService.changePassword(request);
        return new MessageResponse("Password updated");
    }

    @PostMapping("/forgot-password")
    public MessageResponse forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return new MessageResponse("If an account exists, a reset link has been prepared");
    }

    @PostMapping("/reset-password")
    public MessageResponse resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return new MessageResponse("Password updated");
    }

    @GetMapping("/csrf")
    public CsrfResponse csrf(CsrfToken token) {
        return new CsrfResponse(token.getToken(), token.getHeaderName(), "XSRF-TOKEN");
    }
}
