package com.studentmanagement.backend.dto.auth;

import com.studentmanagement.backend.entity.AppUser;
import com.studentmanagement.backend.entity.Role;

public record UserResponse(
    Long id,
    String username,
    String email,
    Role role
) {

    public static UserResponse from(AppUser user) {
        return new UserResponse(
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            user.getRole()
        );
    }
}