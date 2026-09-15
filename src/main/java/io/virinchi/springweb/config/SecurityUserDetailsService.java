package io.virinchi.springweb.config;

import io.virinchi.springweb.domain.User;
import io.virinchi.springweb.repository.UserRepository;
import io.virinchi.springweb.domain.UserStatus;
import java.util.Collections;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class SecurityUserDetailsService implements UserDetailsService {
    private final UserRepository userRepository;

    public SecurityUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) {
        User user = userRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        boolean active = user.getStatus() == UserStatus.ACTIVE;
        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPasswordHash(),
                active,
                active,
                active,
                active,
                active
                        ? Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
                        : Collections.emptyList());
    }
}
