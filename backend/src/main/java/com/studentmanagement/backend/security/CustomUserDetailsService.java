package com.studentmanagement.backend.security;

import com.studentmanagement.backend.entity.AppUser;
import com.studentmanagement.backend.repository.UserRepository;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService
        implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(
        UserRepository userRepository
    ) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) {
        AppUser user = userRepository
            .findByEmailIgnoreCase(email)
            .orElseThrow(() ->
                new UsernameNotFoundException(
                    "Invalid email or password"
                )
            );

        return User
            .withUsername(user.getEmail())
            .password(user.getPasswordHash())
            .authorities("ROLE_" + user.getRole().name())
            .build();
    }
}