package com.studentmanagement.backend.repository;

import com.studentmanagement.backend.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudentRepository extends JpaRepository<Student, Long> {

    boolean existsByStudentNumber(String studentNumber);

    boolean existsByStudentNumberAndIdNot(
        String studentNumber,
        Long id
    );

    boolean existsByEmail(String email);

    boolean existsByEmailAndIdNot(
        String email,
        Long id
    );
}