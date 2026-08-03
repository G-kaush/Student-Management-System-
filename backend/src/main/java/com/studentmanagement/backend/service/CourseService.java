package com.studentmanagement.backend.service;

import com.studentmanagement.backend.dto.CourseRequest;
import com.studentmanagement.backend.entity.Course;
import com.studentmanagement.backend.repository.CourseRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class CourseService {

    private final CourseRepository courseRepository;

    public CourseService(CourseRepository courseRepository) {
        this.courseRepository = courseRepository;
    }

    @Transactional(readOnly = true)
    public List<Course> getAllCourses() {
        return courseRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Course getCourseById(Long id) {
        return courseRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Course not found with ID: " + id
            ));
    }

    public Course createCourse(CourseRequest request) {
        String code = request.code().trim().toUpperCase();

        if (courseRepository.existsByCode(code)) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Course code already exists"
            );
        }

        Course course = new Course();
        course.setCode(code);
        course.setName(request.name().trim());
        course.setDescription(cleanNullable(request.description()));

        return courseRepository.save(course);
    }

    public Course updateCourse(Long id, CourseRequest request) {
        Course course = getCourseById(id);
        String code = request.code().trim().toUpperCase();

        if (courseRepository.existsByCodeAndIdNot(code, id)) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Course code already exists"
            );
        }

        course.setCode(code);
        course.setName(request.name().trim());
        course.setDescription(cleanNullable(request.description()));

        return courseRepository.save(course);
    }

    public void deleteCourse(Long id) {
        if (!courseRepository.existsById(id)) {
            throw new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Course not found with ID: " + id
            );
        }

        courseRepository.deleteById(id);
    }

    private String cleanNullable(String value) {
        return value == null ? null : value.trim();
    }
}