package com.studentmanagement.backend.repository;

import com.studentmanagement.backend.entity.AppUser;
import com.studentmanagement.backend.entity.Course;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CourseRepository extends JpaRepository<Course, Long> {

    List<Course> findAllByOrderByCodeAsc();

    List<Course> findByInstructorOrderByCodeAsc(
        AppUser instructor
    );

    boolean existsByCode(String code);

    boolean existsByCodeAndIdNot(String code, Long id);
}
