package com.studentmanagement.backend.service;

import com.studentmanagement.backend.dto.auth.AuthResponse;
import com.studentmanagement.backend.dto.auth.LoginRequest;
import com.studentmanagement.backend.dto.auth.RegisterRequest;
import com.studentmanagement.backend.dto.auth.UserResponse;
import com.studentmanagement.backend.entity.AppUser;
import com.studentmanagement.backend.repository.UserRepository;
import com.studentmanagement.backend.security.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthService(
        UserRepository userRepository,
        PasswordEncoder passwordEncoder,
        AuthenticationManager authenticationManager,
        JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    public AuthResponse login(LoginRequest request) {
        String email = request.email()
            .trim()
            .toLowerCase();

        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                email,
                request.password()
            )
        );

        AppUser user = userRepository
            .findByEmailIgnoreCase(email)
            .orElseThrow(() ->
                new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid email or password"
                )
            );

        return new AuthResponse(
            jwtService.generateToken(user),
            "Bearer",
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            user.getRole()
        );
    }

    public UserResponse register(
        RegisterRequest request
    ) {
        String username = request.username().trim();

        String email = request.email()
            .trim()
            .toLowerCase();

        if (
            userRepository
                .existsByUsernameIgnoreCase(username)
        ) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Username already exists"
            );
        }

        if (
            userRepository
                .existsByEmailIgnoreCase(email)
        ) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Email already exists"
            );
        }

        AppUser user = new AppUser();
        user.setUsername(username);
        user.setEmail(email);
        user.setPasswordHash(
            passwordEncoder.encode(request.password())
        );
        user.setRole(request.role());

        return UserResponse.from(
            userRepository.save(user)
        );
    }
}