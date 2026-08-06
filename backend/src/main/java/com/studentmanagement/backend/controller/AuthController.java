package com.studentmanagement.backend.controller;

import com.studentmanagement.backend.dto.request.LoginRequest;
import com.studentmanagement.backend.dto.request.RegisterRequest;
import com.studentmanagement.backend.dto.request.StudentRegisterRequest;
import com.studentmanagement.backend.dto.response.AuthResponse;
import com.studentmanagement.backend.dto.response.UserResponse;
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
    public AuthResponse registerStudent(
        @Valid @RequestBody StudentRegisterRequest request
    ) {
        return authService.registerStudent(request);
    }

    @PostMapping("/instructor/register")
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse registerInstructor(
        @Valid @RequestBody RegisterRequest request
    ) {
        return authService.registerInstructor(request);
    }
}
