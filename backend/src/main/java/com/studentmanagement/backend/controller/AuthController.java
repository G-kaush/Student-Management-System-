package com.studentmanagement.backend.controller;

import com.studentmanagement.backend.dto.auth.AuthResponse;
import com.studentmanagement.backend.dto.auth.LoginRequest;
import com.studentmanagement.backend.dto.auth.RegisterRequest;
import com.studentmanagement.backend.dto.auth.UserResponse;
import com.studentmanagement.backend.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public AuthResponse login(
        @Valid @RequestBody LoginRequest request
    ) {
        return authService.login(request);
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse register(
        @Valid @RequestBody RegisterRequest request
    ) {
        return authService.register(request);
    }
}