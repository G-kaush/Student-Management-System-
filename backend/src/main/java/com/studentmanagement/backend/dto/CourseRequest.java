package com.studentmanagement.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CourseRequest(

    @NotBlank(message = "Course code is required")
    @Size(max = 30, message = "Course code cannot exceed 30 characters")
    String code,

    @NotBlank(message = "Course name is required")
    @Size(max = 100, message = "Course name cannot exceed 100 characters")
    @Pattern(
        regexp = "^[A-Za-z]+(?:[ '&.-][A-Za-z]+)*$",
        message = "Course name can contain words and punctuation only"
    )
    String name,

    @Size(max = 500, message = "Description cannot exceed 500 characters")
    String description

) {
}
