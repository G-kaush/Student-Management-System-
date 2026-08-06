package com.studentmanagement.backend.dto.response;

import com.studentmanagement.backend.entity.Course;

public record CourseResponse(
    Long id,
    String code,
    String name,
    String description,
    UserResponse instructor
) {

    public static CourseResponse from(Course course) {
        return new CourseResponse(
            course.getId(),
            course.getCode(),
            course.getName(),
            course.getDescription(),
            UserResponse.from(course.getInstructor())
        );
    }
}
