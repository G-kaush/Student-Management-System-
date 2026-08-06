package com.studentmanagement.backend.service;

import com.studentmanagement.backend.dto.response.CourseResponse;
import com.studentmanagement.backend.dto.response.EnrollmentResponse;
import com.studentmanagement.backend.dto.response.UserResponse;
import com.studentmanagement.backend.entity.AppUser;
import com.studentmanagement.backend.entity.Course;
import com.studentmanagement.backend.entity.Enrollment;
import com.studentmanagement.backend.entity.Role;
import com.studentmanagement.backend.repository.CourseRepository;
import com.studentmanagement.backend.repository.EnrollmentRepository;
import com.studentmanagement.backend.repository.UserRepository;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;

    public EnrollmentService(
        EnrollmentRepository enrollmentRepository,
        CourseRepository courseRepository,
        UserRepository userRepository
    ) {
        this.enrollmentRepository = enrollmentRepository;
        this.courseRepository = courseRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<CourseResponse> getAvailableCoursesForCurrentStudent() {
        AppUser student = getCurrentStudent();

        return courseRepository
            .findAllByOrderByCodeAsc()
            .stream()
            .filter(course ->
                !enrollmentRepository.existsByStudentAndCourse(
                    student,
                    course
                )
            )
            .map(CourseResponse::from)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<CourseResponse> getMyCourses() {
        AppUser student = getCurrentStudent();

        return enrollmentRepository
            .findByStudentOrderByEnrolledAtDesc(student)
            .stream()
            .map(Enrollment::getCourse)
            .map(CourseResponse::from)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<EnrollmentResponse> getAllEnrollments() {
        AppUser user = getCurrentUser();

        List<Enrollment> enrollments =
            user.getRole() == Role.INSTRUCTOR
                ? enrollmentRepository
                    .findByCourseInstructorOrderByEnrolledAtDesc(
                        user
                    )
                : enrollmentRepository.findAll(
                    Sort.by("enrolledAt").descending()
                );

        return enrollments
            .stream()
            .map(EnrollmentResponse::from)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getStudentsForCurrentStaff() {
        AppUser user = getCurrentUser();

        if (user.getRole() == Role.ADMIN) {
            return userRepository
                .findByRoleOrderByUsernameAsc(Role.STUDENT)
                .stream()
                .map(UserResponse::from)
                .toList();
        }

        if (user.getRole() != Role.INSTRUCTOR) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Only staff can view student accounts"
            );
        }

        return enrollmentRepository
            .findByCourseInstructorOrderByEnrolledAtDesc(user)
            .stream()
            .map(Enrollment::getStudent)
            .distinct()
            .sorted((left, right) ->
                left.getUsername()
                    .compareToIgnoreCase(right.getUsername())
            )
            .map(UserResponse::from)
            .toList();
    }

    public EnrollmentResponse enrollCurrentStudent(Long courseId) {
        AppUser student = getCurrentStudent();

        Course course = courseRepository
            .findById(courseId)
            .orElseThrow(() ->
                new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Course not found with ID: " + courseId
                )
            );

        if (
            enrollmentRepository
                .existsByStudentAndCourse(student, course)
        ) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "You are already enrolled in this course"
            );
        }

        Enrollment enrollment = new Enrollment();
        enrollment.setStudent(student);
        enrollment.setCourse(course);

        return EnrollmentResponse.from(
            enrollmentRepository.save(enrollment)
        );
    }

    public void unenrollCurrentStudent(Long courseId) {
        AppUser student = getCurrentStudent();

        Course course = courseRepository
            .findById(courseId)
            .orElseThrow(() ->
                new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Course not found with ID: " + courseId
                )
            );

        Enrollment enrollment = enrollmentRepository
            .findByStudentAndCourse(student, course)
            .orElseThrow(() ->
                new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "You are not enrolled in this course"
                )
            );

        enrollmentRepository.delete(enrollment);
    }

    public void removeEnrollmentForCurrentStaff(Long id) {
        AppUser user = getCurrentUser();

        if (
            user.getRole() != Role.ADMIN
                && user.getRole() != Role.INSTRUCTOR
        ) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Only staff can remove enrollments"
            );
        }

        Enrollment enrollment = enrollmentRepository
            .findById(id)
            .orElseThrow(() ->
                new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Enrollment not found with ID: " + id
                )
            );

        if (
            user.getRole() == Role.INSTRUCTOR
                && !enrollment
                    .getCourse()
                    .getInstructor()
                    .getId()
                    .equals(user.getId())
        ) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "You can only remove enrollments from your own courses"
            );
        }

        enrollmentRepository.delete(enrollment);
    }

    private AppUser getCurrentStudent() {
        AppUser user = getCurrentUser();

        if (user.getRole() != Role.STUDENT) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Only students can use enrollment actions"
            );
        }

        return user;
    }

    private AppUser getCurrentUser() {
        String email = SecurityContextHolder
            .getContext()
            .getAuthentication()
            .getName();

        return userRepository
            .findByEmailIgnoreCase(email)
            .orElseThrow(() ->
                new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Authenticated user was not found"
                )
            );
    }
}
