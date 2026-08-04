package com.studentmanagement.backend.dto.auth;

import com.studentmanagement.backend.entity.Role;

public record AuthResponse(
    String token,
    String tokenType,
    Long userId,
    String username,
    String email,
    Role role
) {
}