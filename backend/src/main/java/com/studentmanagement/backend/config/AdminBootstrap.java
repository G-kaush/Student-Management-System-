package com.studentmanagement.backend.config;

import com.studentmanagement.backend.entity.AppUser;
import com.studentmanagement.backend.entity.Role;
import com.studentmanagement.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AdminBootstrap
        implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.bootstrap-admin.username:}")
    private String username;

    @Value("${app.bootstrap-admin.email:}")
    private String email;

    @Value("${app.bootstrap-admin.password:}")
    private String password;

    public AdminBootstrap(
        UserRepository userRepository,
        PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (
            username.isBlank()
                || email.isBlank()
                || password.isBlank()
        ) {
            return;
        }

        if (
            userRepository
                .existsByEmailIgnoreCase(email)
        ) {
            return;
        }

        AppUser admin = new AppUser();
        admin.setUsername(username.trim());
        admin.setEmail(email.trim().toLowerCase());
        admin.setPasswordHash(
            passwordEncoder.encode(password)
        );
        admin.setRole(Role.ADMIN);

        userRepository.save(admin);

        System.out.println(
            "Initial ADMIN account created"
        );
    }
}