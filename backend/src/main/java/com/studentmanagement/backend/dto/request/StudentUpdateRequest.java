package com.studentmanagement.backend.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record StudentUpdateRequest(

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

    @Size(
        min = 8,
        max = 72,
        message = "Password must contain 8 to 72 characters"
    )
    @Pattern(
        regexp = "^$|^(?=.*[A-Za-z])(?=.*\\d).+$",
        message = "Password must contain a letter and a number"
    )
    String password

) {
}
