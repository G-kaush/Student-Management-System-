package com.studentmanagement.backend;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import com.studentmanagement.backend.entity.AppUser;
import com.studentmanagement.backend.entity.Role;
import com.studentmanagement.backend.repository.CourseRepository;
import com.studentmanagement.backend.repository.EnrollmentRepository;
import com.studentmanagement.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class BackendApplicationTests {

    private static final String ADMIN_EMAIL =
        "admin@test.local";
    private static final String ADMIN_PASSWORD =
        "Admin123";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        enrollmentRepository.deleteAll();
        courseRepository.deleteAll();
        userRepository.deleteAll();

        AppUser admin = new AppUser();
        admin.setUsername("Admin User");
        admin.setEmail(ADMIN_EMAIL);
        admin.setPasswordHash(
            passwordEncoder.encode(ADMIN_PASSWORD)
        );
        admin.setRole(Role.ADMIN);
        admin.setApproved(true);

        userRepository.save(admin);
    }

    @Test
    void contextLoads() {
    }

    @Test
    void fullRoleBasedCourseAndEnrollmentFlow()
        throws Exception {

        long suffix = System.currentTimeMillis();
        String studentEmail =
            "student" + suffix + "@test.local";
        String instructorEmail =
            "instructor" + suffix + "@test.local";

        MvcResult studentRegister = postJson(
            "/api/auth/register",
            """
            {
              "username": "Student Test",
              "email": "%s",
              "password": "Student123"
            }
            """.formatted(studentEmail)
        )
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.role").value("STUDENT"))
            .andReturn();

        String studentToken = readString(
            studentRegister,
            "$.token"
        );

        MvcResult instructorRegister = postJson(
            "/api/auth/instructor/register",
            """
            {
              "username": "Instructor Test",
              "email": "%s",
              "password": "Instructor123",
              "role": "INSTRUCTOR"
            }
            """.formatted(instructorEmail)
        )
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.approved").value(false))
            .andReturn();

        Number instructorId = readNumber(
            instructorRegister,
            "$.id"
        );

        postJson(
            "/api/auth/login",
            """
            {
              "email": "%s",
              "password": "Instructor123"
            }
            """.formatted(instructorEmail)
        )
            .andExpect(status().isForbidden());

        String adminToken = login(
            ADMIN_EMAIL,
            ADMIN_PASSWORD
        );

        postJsonWithToken(
            "/api/courses",
            """
            {
              "code": "BLOCK%s",
              "name": "Blocked Course",
              "description": "Students cannot create courses.",
              "instructorId": %d
            }
            """.formatted(
                suffix % 100000,
                instructorId.longValue()
            ),
            studentToken
        )
            .andExpect(status().isForbidden());

        mockMvc.perform(
            patch(
                "/api/users/{id}/approve",
                instructorId.longValue()
            )
                .header(
                    HttpHeaders.AUTHORIZATION,
                    bearer(adminToken)
                )
        )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.approved").value(true));

        String instructorToken = login(
            instructorEmail,
            "Instructor123"
        );

        MvcResult courseCreate = postJsonWithToken(
            "/api/courses",
            """
            {
              "code": "C%s",
              "name": "Algorithms",
              "description": "Course created by instructor."
            }
            """.formatted(suffix % 100000),
            instructorToken
        )
            .andExpect(status().isCreated())
            .andExpect(
                jsonPath("$.instructor.id")
                    .value(instructorId.longValue())
            )
            .andReturn();

        Number courseId = readNumber(
            courseCreate,
            "$.id"
        );

        mockMvc.perform(
            get("/api/courses/available")
                .header(
                    HttpHeaders.AUTHORIZATION,
                    bearer(studentToken)
                )
        )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(1)))
            .andExpect(
                jsonPath("$[0].id")
                    .value(courseId.longValue())
            );

        MvcResult enrollmentCreate = mockMvc.perform(
            post(
                "/api/enrollments/{courseId}",
                courseId.longValue()
            )
                .header(
                    HttpHeaders.AUTHORIZATION,
                    bearer(studentToken)
                )
        )
            .andExpect(status().isCreated())
            .andExpect(
                jsonPath("$.course.id")
                    .value(courseId.longValue())
            )
            .andReturn();

        Number enrollmentId = readNumber(
            enrollmentCreate,
            "$.id"
        );

        mockMvc.perform(
            post(
                "/api/enrollments/{courseId}",
                courseId.longValue()
            )
                .header(
                    HttpHeaders.AUTHORIZATION,
                    bearer(studentToken)
                )
        )
            .andExpect(status().isConflict());

        mockMvc.perform(
            delete(
                "/api/enrollments/my-courses/{courseId}",
                courseId.longValue()
            )
                .header(
                    HttpHeaders.AUTHORIZATION,
                    bearer(studentToken)
                )
        )
            .andExpect(status().isNoContent());

        mockMvc.perform(
            get("/api/enrollments/my-courses")
                .header(
                    HttpHeaders.AUTHORIZATION,
                    bearer(studentToken)
                )
        )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(0)));

        enrollmentCreate = mockMvc.perform(
            post(
                "/api/enrollments/{courseId}",
                courseId.longValue()
            )
                .header(
                    HttpHeaders.AUTHORIZATION,
                    bearer(studentToken)
                )
        )
            .andExpect(status().isCreated())
            .andReturn();

        enrollmentId = readNumber(
            enrollmentCreate,
            "$.id"
        );

        mockMvc.perform(
            get("/api/enrollments")
                .header(
                    HttpHeaders.AUTHORIZATION,
                    bearer(instructorToken)
                )
        )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(1)))
            .andExpect(
                jsonPath("$[0].id")
                    .value(enrollmentId.longValue())
            );

        mockMvc.perform(
            delete(
                "/api/enrollments/{id}",
                enrollmentId.longValue()
            )
                .header(
                    HttpHeaders.AUTHORIZATION,
                    bearer(instructorToken)
                )
        )
            .andExpect(status().isNoContent());

        mockMvc.perform(
            get("/api/enrollments/my-courses")
                .header(
                    HttpHeaders.AUTHORIZATION,
                    bearer(studentToken)
                )
        )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void adminCanManageStudentsAndStudentCanUpdateProfile()
        throws Exception {

        long suffix = System.currentTimeMillis();
        String adminToken = login(
            ADMIN_EMAIL,
            ADMIN_PASSWORD
        );

        MvcResult createdStudent = postJsonWithToken(
            "/api/users/students",
            """
            {
              "username": "Managed Student",
              "email": "managed%s@test.local",
              "password": "Student123"
            }
            """.formatted(suffix),
            adminToken
        )
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.role").value("STUDENT"))
            .andReturn();

        Number studentId = readNumber(
            createdStudent,
            "$.id"
        );

        putJsonWithToken(
            "/api/users/students/" + studentId.longValue(),
            """
            {
              "username": "Managed Updated",
              "email": "managed.updated%s@test.local",
              "password": null
            }
            """.formatted(suffix),
            adminToken
        )
            .andExpect(status().isOk())
            .andExpect(
                jsonPath("$.username")
                    .value("Managed Updated")
            );

        String studentToken = login(
            "managed.updated" + suffix + "@test.local",
            "Student123"
        );

        putJsonWithToken(
            "/api/users/me",
            """
            {
              "username": "Self Updated",
              "email": "self.updated%s@test.local",
              "currentPassword": "Student123",
              "newPassword": "Newpass123"
            }
            """.formatted(suffix),
            studentToken
        )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.role").value("STUDENT"))
            .andExpect(
                jsonPath("$.email")
                    .value("self.updated" + suffix + "@test.local")
            );

        mockMvc.perform(
            delete(
                "/api/users/students/{id}",
                studentId.longValue()
            )
                .header(
                    HttpHeaders.AUTHORIZATION,
                    bearer(adminToken)
                )
        )
            .andExpect(status().isNoContent());
    }

    @Test
    void adminCannotUseSelfProfileUpdate()
        throws Exception {

        String adminToken = login(
            ADMIN_EMAIL,
            ADMIN_PASSWORD
        );

        putJsonWithToken(
            "/api/users/me",
            """
            {
              "username": "Admin Changed",
              "email": "admin.changed@test.local",
              "currentPassword": "Admin123",
              "newPassword": ""
            }
            """,
            adminToken
        )
            .andExpect(status().isForbidden());
    }

    private String login(
        String email,
        String password
    ) throws Exception {

        MvcResult result = postJson(
            "/api/auth/login",
            """
            {
              "email": "%s",
              "password": "%s"
            }
            """.formatted(email, password)
        )
            .andExpect(status().isOk())
            .andReturn();

        return readString(result, "$.token");
    }

    private org.springframework.test.web.servlet.ResultActions
        postJson(
            String path,
            String json
        ) throws Exception {

        return mockMvc.perform(
            post(path)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json)
        );
    }

    private org.springframework.test.web.servlet.ResultActions
        postJsonWithToken(
            String path,
            String json,
            String token
        ) throws Exception {

        return mockMvc.perform(
            post(path)
                .contentType(MediaType.APPLICATION_JSON)
                .header(
                    HttpHeaders.AUTHORIZATION,
                    bearer(token)
                )
                .content(json)
        );
    }

    private org.springframework.test.web.servlet.ResultActions
        putJsonWithToken(
            String path,
            String json,
            String token
        ) throws Exception {

        return mockMvc.perform(
            put(path)
                .contentType(MediaType.APPLICATION_JSON)
                .header(
                    HttpHeaders.AUTHORIZATION,
                    bearer(token)
                )
                .content(json)
        );
    }

    private String readString(
        MvcResult result,
        String path
    ) throws Exception {

        return JsonPath.read(
            result
                .getResponse()
                .getContentAsString(),
            path
        );
    }

    private Number readNumber(
        MvcResult result,
        String path
    ) throws Exception {

        return JsonPath.read(
            result
                .getResponse()
                .getContentAsString(),
            path
        );
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }
}
