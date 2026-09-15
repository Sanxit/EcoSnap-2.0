package io.virinchi.springweb.config;

import io.virinchi.springweb.domain.User;
import io.virinchi.springweb.domain.UserStatus;
import io.virinchi.springweb.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class ActiveUserFilter extends OncePerRequestFilter {
    private final UserRepository userRepository;

    public ActiveUserFilter(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            filterChain.doFilter(request, response);
            return;
        }

        String path = request.getServletPath();
        if ("/api/auth/me".equals(path) || "/api/auth/logout".equals(path)) {
            filterChain.doFilter(request, response);
            return;
        }

        String email = authentication.getName();
        if (email == null || email.isBlank()) {
            filterChain.doFilter(request, response);
            return;
        }

        User user = userRepository.findByEmail(email.toLowerCase()).orElse(null);
        if (user == null || user.getStatus() != UserStatus.ACTIVE) {
            SecurityContextHolder.clearContext();
            var session = request.getSession(false);
            if (session != null) {
                session.invalidate();
            }
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Account is not active");
            return;
        }

        filterChain.doFilter(request, response);
    }
}
