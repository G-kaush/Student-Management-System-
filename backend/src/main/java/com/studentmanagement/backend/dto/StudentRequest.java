package com.studentmanagement.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record StudentRequest(

    @NotBlank(message = "Student number is required")
    @Size(max = 30)
    String studentNumber,

    @NotBlank(message = "First name is required")
    @Size(max = 100)
    String firstName,

    @NotBlank(message = "Last name is required")
    @Size(max = 100)
    String lastName,

    @NotBlank(message = "Email is required")
    @Email(message = "Enter a valid email address")
    @Size(max = 150)
    String email,

    @Size(max = 30)
    String phone,

    @NotNull(message = "Course ID is required")
    Long courseId

) {
}