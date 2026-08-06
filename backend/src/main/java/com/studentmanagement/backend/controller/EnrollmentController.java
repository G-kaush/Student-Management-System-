package com.studentmanagement.backend.controller;

import com.studentmanagement.backend.dto.response.CourseResponse;
import com.studentmanagement.backend.dto.response.EnrollmentResponse;
import com.studentmanagement.backend.service.EnrollmentService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/enrollments")
public class EnrollmentController {

    private final EnrollmentService enrollmentService;

    public EnrollmentController(
        EnrollmentService enrollmentService
    ) {
        this.enrollmentService = enrollmentService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'INSTRUCTOR')")
    public List<EnrollmentResponse> getAllEnrollments() {
        return enrollmentService.getAllEnrollments();
    }

    @GetMapping("/my-courses")
    @PreAuthorize("hasRole('STUDENT')")
    public List<CourseResponse> getMyCourses() {
        return enrollmentService.getMyCourses();
    }

    @PostMapping("/{courseId}")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('STUDENT')")
    public EnrollmentResponse enroll(
        @PathVariable Long courseId
    ) {
        return enrollmentService
            .enrollCurrentStudent(courseId);
    }

    @DeleteMapping("/my-courses/{courseId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('STUDENT')")
    public void unenrollCurrentStudent(
        @PathVariable Long courseId
    ) {
        enrollmentService.unenrollCurrentStudent(courseId);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('ADMIN', 'INSTRUCTOR')")
    public void removeEnrollment(
        @PathVariable Long id
    ) {
        enrollmentService.removeEnrollmentForCurrentStaff(id);
    }
}
