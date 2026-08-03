package com.studentmanagement.backend.service;

import com.studentmanagement.backend.dto.StudentRequest;
import com.studentmanagement.backend.entity.Course;
import com.studentmanagement.backend.entity.Student;
import com.studentmanagement.backend.repository.CourseRepository;
import com.studentmanagement.backend.repository.StudentRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class StudentService {

    private final StudentRepository studentRepository;
    private final CourseRepository courseRepository;

    public StudentService(
        StudentRepository studentRepository,
        CourseRepository courseRepository
    ) {
        this.studentRepository = studentRepository;
        this.courseRepository = courseRepository;
    }

    @Transactional(readOnly = true)
    public List<Student> getAllStudents() {
        return studentRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Student getStudentById(Long id) {
        return studentRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Student not found with ID: " + id
            ));
    }

    public Student createStudent(StudentRequest request) {
        String studentNumber =
            request.studentNumber().trim().toUpperCase();

        String email = request.email().trim().toLowerCase();

        if (studentRepository.existsByStudentNumber(studentNumber)) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Student number already exists"
            );
        }

        if (studentRepository.existsByEmail(email)) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Student email already exists"
            );
        }

        Course course = findCourse(request.courseId());

        Student student = new Student();
        student.setStudentNumber(studentNumber);
        student.setFirstName(request.firstName().trim());
        student.setLastName(request.lastName().trim());
        student.setEmail(email);
        student.setPhone(cleanNullable(request.phone()));
        student.setCourse(course);

        return studentRepository.save(student);
    }

    public Student updateStudent(
        Long id,
        StudentRequest request
    ) {
        Student student = getStudentById(id);

        String studentNumber =
            request.studentNumber().trim().toUpperCase();

        String email = request.email().trim().toLowerCase();

        if (
            studentRepository.existsByStudentNumberAndIdNot(
                studentNumber,
                id
            )
        ) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Student number already exists"
            );
        }

        if (studentRepository.existsByEmailAndIdNot(email, id)) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Student email already exists"
            );
        }

        Course course = findCourse(request.courseId());

        student.setStudentNumber(studentNumber);
        student.setFirstName(request.firstName().trim());
        student.setLastName(request.lastName().trim());
        student.setEmail(email);
        student.setPhone(cleanNullable(request.phone()));
        student.setCourse(course);

        return studentRepository.save(student);
    }

    public void deleteStudent(Long id) {
        if (!studentRepository.existsById(id)) {
            throw new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Student not found with ID: " + id
            );
        }

        studentRepository.deleteById(id);
    }

    private Course findCourse(Long courseId) {
        return courseRepository.findById(courseId)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Course not found with ID: " + courseId
            ));
    }

    private String cleanNullable(String value) {
        return value == null ? null : value.trim();
    }
}