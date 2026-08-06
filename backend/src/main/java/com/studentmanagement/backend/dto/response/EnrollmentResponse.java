package com.studentmanagement.backend.dto.response;

import com.studentmanagement.backend.entity.Enrollment;
import java.time.Instant;

public record EnrollmentResponse(
    Long id,
    UserResponse student,
    CourseResponse course,
    Instant enrolledAt
) {

    public static EnrollmentResponse from(
        Enrollment enrollment
    ) {
        return new EnrollmentResponse(
            enrollment.getId(),
            UserResponse.from(enrollment.getStudent()),
            CourseResponse.from(enrollment.getCourse()),
            enrollment.getEnrolledAt()
        );
    }
}
