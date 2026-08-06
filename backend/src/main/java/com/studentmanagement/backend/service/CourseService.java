package com.studentmanagement.backend.service;

import com.studentmanagement.backend.dto.request.CourseRequest;
import com.studentmanagement.backend.dto.response.CourseResponse;
import com.studentmanagement.backend.entity.AppUser;
import com.studentmanagement.backend.entity.Course;
import com.studentmanagement.backend.entity.Role;
import com.studentmanagement.backend.repository.CourseRepository;
import com.studentmanagement.backend.repository.EnrollmentRepository;
import com.studentmanagement.backend.repository.UserRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class CourseService {

    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final EnrollmentRepository enrollmentRepository;

    public CourseService(
        CourseRepository courseRepository,
        UserRepository userRepository,
        EnrollmentRepository enrollmentRepository
    ) {
        this.courseRepository = courseRepository;
        this.userRepository = userRepository;
        this.enrollmentRepository = enrollmentRepository;
    }

    @Transactional(readOnly = true)
    public List<CourseResponse> getCoursesForCurrentUser() {
        AppUser user = getCurrentUser();

        List<Course> courses = user.getRole() == Role.INSTRUCTOR
            ? courseRepository.findByInstructorOrderByCodeAsc(user)
            : courseRepository.findAllByOrderByCodeAsc();

        return courses
            .stream()
            .map(CourseResponse::from)
            .toList();
    }

    @Transactional(readOnly = true)
    public CourseResponse getCourseById(Long id) {
        Course course = getCourseEntityById(id);
        AppUser user = getCurrentUser();

        if (
            user.getRole() == Role.INSTRUCTOR
                && !course.getInstructor().getId().equals(user.getId())
        ) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "You can only view your own courses"
            );
        }

        return CourseResponse.from(course);
    }

    private Course getCourseEntityById(Long id) {
        return courseRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Course not found with ID: " + id
            ));
    }

    public CourseResponse createCourse(CourseRequest request) {
        String code = request.code().trim().toUpperCase();

        if (courseRepository.existsByCode(code)) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Course code already exists"
            );
        }

        AppUser currentUser = getCurrentUser();
        AppUser instructor = getInstructorForWrite(
            currentUser,
            request.instructorId()
        );

        Course course = new Course();
        course.setCode(code);
        course.setName(request.name().trim());
        course.setDescription(cleanNullable(request.description()));
        course.setInstructor(instructor);

        return CourseResponse.from(
            courseRepository.save(course)
        );
    }

    public CourseResponse updateCourse(
        Long id,
        CourseRequest request
    ) {
        Course course = getCourseEntityById(id);
        String code = request.code().trim().toUpperCase();
        AppUser currentUser = getCurrentUser();

        if (courseRepository.existsByCodeAndIdNot(code, id)) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Course code already exists"
            );
        }

        AppUser instructor = getInstructorForUpdate(
            currentUser,
            course,
            request.instructorId()
        );

        course.setCode(code);
        course.setName(request.name().trim());
        course.setDescription(cleanNullable(request.description()));
        course.setInstructor(instructor);

        return CourseResponse.from(
            courseRepository.save(course)
        );
    }

    public void deleteCourse(Long id) {
        Course course = getCourseEntityById(id);
        AppUser currentUser = getCurrentUser();

        if (
            currentUser.getRole() == Role.INSTRUCTOR
                && !course.getInstructor().getId()
                    .equals(currentUser.getId())
        ) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "You can only delete your own courses"
            );
        }

        if (
            currentUser.getRole() != Role.ADMIN
                && currentUser.getRole() != Role.INSTRUCTOR
        ) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Only admins and instructors can delete courses"
            );
        }

        enrollmentRepository.deleteByCourse(course);
        courseRepository.delete(course);
    }

    private String cleanNullable(String value) {
        return value == null ? null : value.trim();
    }

    private AppUser getApprovedInstructor(Long instructorId) {
        if (instructorId == null) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Instructor is required"
            );
        }

        AppUser instructor = userRepository
            .findById(instructorId)
            .orElseThrow(() ->
                new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Instructor not found with ID: " + instructorId
                )
            );

        if (
            instructor.getRole() != Role.INSTRUCTOR
                || !instructor.isApproved()
        ) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Course must be assigned to an approved instructor"
            );
        }

        return instructor;
    }

    private AppUser getInstructorForWrite(
        AppUser currentUser,
        Long instructorId
    ) {
        if (currentUser.getRole() == Role.ADMIN) {
            return getApprovedInstructor(instructorId);
        }

        if (currentUser.getRole() == Role.INSTRUCTOR) {
            return currentUser;
        }

        throw new ResponseStatusException(
            HttpStatus.FORBIDDEN,
            "Only admins and instructors can create courses"
        );
    }

    private AppUser getInstructorForUpdate(
        AppUser currentUser,
        Course course,
        Long instructorId
    ) {
        if (currentUser.getRole() == Role.ADMIN) {
            return getApprovedInstructor(instructorId);
        }

        if (currentUser.getRole() == Role.INSTRUCTOR) {
            if (
                !course.getInstructor().getId()
                    .equals(currentUser.getId())
            ) {
                throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You can only update your own courses"
                );
            }

            return currentUser;
        }

        throw new ResponseStatusException(
            HttpStatus.FORBIDDEN,
            "Only admins and instructors can update courses"
        );
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
