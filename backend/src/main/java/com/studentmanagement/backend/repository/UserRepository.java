package com.studentmanagement.backend.repository;

import com.studentmanagement.backend.entity.AppUser;
import com.studentmanagement.backend.entity.Role;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository
        extends JpaRepository<AppUser, Long> {

    Optional<AppUser> findByEmailIgnoreCase(String email);

    Optional<AppUser> findByUsernameIgnoreCase(String username);

    List<AppUser> findByRoleOrderByUsernameAsc(Role role);

    List<AppUser> findByRoleAndApprovedTrueOrderByUsernameAsc(
        Role role
    );

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByUsernameIgnoreCase(String username);
}
