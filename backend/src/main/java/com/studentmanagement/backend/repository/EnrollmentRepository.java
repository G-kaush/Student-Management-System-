package com.studentmanagement.backend.repository;

import com.studentmanagement.backend.entity.AppUser;
import com.studentmanagement.backend.entity.Course;
import com.studentmanagement.backend.entity.Enrollment;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EnrollmentRepository
        extends JpaRepository<Enrollment, Long> {

    boolean existsByStudentAndCourse(
        AppUser student,
        Course course
    );

    List<Enrollment> findByStudentOrderByEnrolledAtDesc(
        AppUser student
    );

    java.util.Optional<Enrollment> findByStudentAndCourse(
        AppUser student,
        Course course
    );

    List<Enrollment> findByCourseInstructorOrderByEnrolledAtDesc(
        AppUser instructor
    );

    void deleteByStudent(AppUser student);

    void deleteByCourse(Course course);
}
