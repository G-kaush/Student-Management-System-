package com.studentmanagement.backend.controller;

import com.studentmanagement.backend.dto.request.ProfileUpdateRequest;
import com.studentmanagement.backend.dto.request.StudentCreateRequest;
import com.studentmanagement.backend.dto.request.StudentUpdateRequest;
import com.studentmanagement.backend.dto.response.AuthResponse;
import com.studentmanagement.backend.dto.response.UserResponse;
import com.studentmanagement.backend.entity.AppUser;
import com.studentmanagement.backend.entity.Role;
import com.studentmanagement.backend.repository.EnrollmentRepository;
import com.studentmanagement.backend.repository.UserRepository;
import com.studentmanagement.backend.security.JwtService;
import com.studentmanagement.backend.service.EnrollmentService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;
    private final EnrollmentService enrollmentService;
    private final EnrollmentRepository enrollmentRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public UserController(
        UserRepository userRepository,
        EnrollmentService enrollmentService,
        EnrollmentRepository enrollmentRepository,
        PasswordEncoder passwordEncoder,
        JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.enrollmentService = enrollmentService;
        this.enrollmentRepository = enrollmentRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserResponse> getUsers() {
        return userRepository
            .findAll(Sort.by("username").ascending())
            .stream()
            .map(UserResponse::from)
            .toList();
    }

    @GetMapping("/students")
    @PreAuthorize("hasAnyRole('ADMIN', 'INSTRUCTOR')")
    public List<UserResponse> getStudents() {
        return enrollmentService.getStudentsForCurrentStaff();
    }

    @PutMapping("/me")
    @PreAuthorize("hasAnyRole('INSTRUCTOR', 'STUDENT')")
    public AuthResponse updateCurrentProfile(
        @Valid @RequestBody ProfileUpdateRequest request
    ) {
        AppUser user = getCurrentUser();

        if (user.getRole() == Role.ADMIN) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Admin profile updates are not available here"
            );
        }

        if (
            !passwordEncoder.matches(
                request.currentPassword(),
                user.getPasswordHash()
            )
        ) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Current password is incorrect"
            );
        }

        String username = request.username().trim();
        String email = request.email().trim().toLowerCase();

        ensureUsernameIsAvailable(username, user.getId());
        ensureEmailIsAvailable(email, user.getId());

        user.setUsername(username);
        user.setEmail(email);

        if (
            request.newPassword() != null
                && !request.newPassword().isBlank()
        ) {
            user.setPasswordHash(
                passwordEncoder.encode(request.newPassword())
            );
        }

        AppUser saved = userRepository.save(user);

        return new AuthResponse(
            jwtService.generateToken(saved),
            "Bearer",
            saved.getId(),
            saved.getUsername(),
            saved.getEmail(),
            saved.getRole()
        );
    }

    @PostMapping("/students")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse createStudent(
        @Valid @RequestBody StudentCreateRequest request
    ) {
        String username = request.username().trim();
        String email = request.email().trim().toLowerCase();

        ensureUsernameIsAvailable(username, null);
        ensureEmailIsAvailable(email, null);

        AppUser student = new AppUser();
        student.setUsername(username);
        student.setEmail(email);
        student.setPasswordHash(
            passwordEncoder.encode(request.password())
        );
        student.setRole(Role.STUDENT);
        student.setApproved(true);

        return UserResponse.from(
            userRepository.save(student)
        );
    }

    @PutMapping("/students/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse updateStudent(
        @PathVariable Long id,
        @Valid @RequestBody StudentUpdateRequest request
    ) {
        AppUser student = getStudentById(id);
        String username = request.username().trim();
        String email = request.email().trim().toLowerCase();

        ensureUsernameIsAvailable(username, id);
        ensureEmailIsAvailable(email, id);

        student.setUsername(username);
        student.setEmail(email);

        if (
            request.password() != null
                && !request.password().isBlank()
        ) {
            student.setPasswordHash(
                passwordEncoder.encode(request.password())
            );
        }

        return UserResponse.from(
            userRepository.save(student)
        );
    }

    @DeleteMapping("/students/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public void deleteStudent(@PathVariable Long id) {
        AppUser student = getStudentById(id);

        enrollmentRepository.deleteByStudent(student);
        userRepository.delete(student);
    }

    @GetMapping("/instructors")
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserResponse> getApprovedInstructors() {
        return userRepository
            .findByRoleAndApprovedTrueOrderByUsernameAsc(
                Role.INSTRUCTOR
            )
            .stream()
            .map(UserResponse::from)
            .toList();
    }

    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse approveInstructor(
        @PathVariable Long id
    ) {
        AppUser user = userRepository
            .findById(id)
            .orElseThrow(() ->
                new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "User not found with ID: " + id
                )
            );

        if (user.getRole() != Role.INSTRUCTOR) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Only instructor accounts can be approved"
            );
        }

        user.setApproved(true);

        return UserResponse.from(
            userRepository.save(user)
        );
    }

    private AppUser getStudentById(Long id) {
        AppUser student = userRepository
            .findById(id)
            .orElseThrow(() ->
                new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Student not found with ID: " + id
                )
            );

        if (student.getRole() != Role.STUDENT) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Only student accounts can be managed here"
            );
        }

        return student;
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

    private void ensureUsernameIsAvailable(
        String username,
        Long currentUserId
    ) {
        userRepository
            .findByUsernameIgnoreCase(username)
            .filter(user ->
                currentUserId == null
                    || !user.getId().equals(currentUserId)
            )
            .ifPresent(user -> {
                throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Username already exists"
                );
            });
    }

    private void ensureEmailIsAvailable(
        String email,
        Long currentUserId
    ) {
        userRepository
            .findByEmailIgnoreCase(email)
            .filter(user ->
                currentUserId == null
                    || !user.getId().equals(currentUserId)
            )
            .ifPresent(user -> {
                throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Email already exists"
                );
            });
    }
}
