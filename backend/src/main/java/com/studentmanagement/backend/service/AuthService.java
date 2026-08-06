package com.studentmanagement.backend.service;

import com.studentmanagement.backend.dto.request.LoginRequest;
import com.studentmanagement.backend.dto.request.RegisterRequest;
import com.studentmanagement.backend.dto.request.StudentRegisterRequest;
import com.studentmanagement.backend.dto.response.AuthResponse;
import com.studentmanagement.backend.dto.response.UserResponse;
import com.studentmanagement.backend.entity.AppUser;
import com.studentmanagement.backend.entity.Role;
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

        if (!user.isApproved()) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Your instructor account is waiting for admin approval"
            );
        }

        return new AuthResponse(
            jwtService.generateToken(user),
            "Bearer",
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            user.getRole()
        );
    }

    public UserResponse registerInstructor(
        RegisterRequest request
    ) {
        if (
            request.role() != null
                && request.role() != Role.INSTRUCTOR
        ) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Only instructor accounts can be requested here"
            );
        }

        AppUser user = createUser(
            request.username(),
            request.email(),
            request.password(),
            Role.INSTRUCTOR,
            false
        );

        return UserResponse.from(
            user
        );
    }

    public AuthResponse registerStudent(
        StudentRegisterRequest request
    ) {
        AppUser user = createUser(
            request.username(),
            request.email(),
            request.password(),
            Role.STUDENT,
            true
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

    private AppUser createUser(
        String rawUsername,
        String rawEmail,
        String rawPassword,
        Role role,
        boolean approved
    ) {
        String username = rawUsername.trim();

        String email = rawEmail
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
            passwordEncoder.encode(rawPassword)
        );
        user.setRole(role);
        user.setApproved(approved);

        return userRepository.save(user);
    }
}
