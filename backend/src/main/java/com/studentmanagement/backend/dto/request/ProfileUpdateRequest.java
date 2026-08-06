package com.studentmanagement.backend.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ProfileUpdateRequest(

    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 100)
    @Pattern(
        regexp = "^[A-Za-z]+(?:[ '-][A-Za-z]+)*$",
        message = "Username can contain letters, spaces, apostrophes and hyphens only"
    )
    String username,

    @NotBlank(message = "Email is required")
    @Email(message = "Enter a valid email address")
    @Size(max = 150)
    String email,

    @NotBlank(message = "Current password is required")
    String currentPassword,

    @Size(
        min = 8,
        max = 72,
        message = "New password must contain 8 to 72 characters"
    )
    @Pattern(
        regexp = "^$|^(?=.*[A-Za-z])(?=.*\\d).+$",
        message = "New password must contain a letter and a number"
    )
    String newPassword

) {
}
