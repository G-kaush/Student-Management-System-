package com.studentmanagement.backend.config;

import com.studentmanagement.backend.security.CustomUserDetailsService;
import com.studentmanagement.backend.security.JwtAuthenticationFilter;
import jakarta.servlet.http.HttpServletResponse;
import java.util.Arrays;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider(
        CustomUserDetailsService userDetailsService,
        PasswordEncoder passwordEncoder
    ) {
        DaoAuthenticationProvider provider =
            new DaoAuthenticationProvider(userDetailsService);

        provider.setPasswordEncoder(passwordEncoder);

        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(
        DaoAuthenticationProvider provider
    ) {
        return new ProviderManager(provider);
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource(
        @Value("${app.cors.allowed-origins}") String allowedOrigins
    ) {
        CorsConfiguration configuration =
            new CorsConfiguration();

        configuration.setAllowedOrigins(
            Arrays.asList(
                allowedOrigins.split("\\s*,\\s*")
            )
        );
        configuration.setAllowedMethods(
            Arrays.asList(
                "GET",
                "POST",
                "PUT",
                "PATCH",
                "DELETE",
                "OPTIONS"
            )
        );
        configuration.setAllowedHeaders(
            Arrays.asList("*")
        );

        UrlBasedCorsConfigurationSource source =
            new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration(
            "/api/**",
            configuration
        );

        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
        HttpSecurity http,
        JwtAuthenticationFilter jwtFilter,
        DaoAuthenticationProvider provider
    ) throws Exception {

        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(Customizer.withDefaults())
            .sessionManagement(session ->
                session.sessionCreationPolicy(
                    SessionCreationPolicy.STATELESS
                )
            )
            .authenticationProvider(provider)
            .authorizeHttpRequests(authorize -> authorize

                .requestMatchers(
                    HttpMethod.OPTIONS,
                    "/**"
                ).permitAll()

                .requestMatchers(
                    "/api/health",
                    "/api/auth/login",
                    "/api/auth/register",
                    "/api/auth/instructor/register"
                ).permitAll()

                .requestMatchers(
                    HttpMethod.GET,
                    "/api/courses/available"
                ).hasRole("STUDENT")

                .requestMatchers(
                    HttpMethod.GET,
                    "/api/courses/**"
                ).hasAnyRole("ADMIN", "INSTRUCTOR", "STUDENT")

                .requestMatchers(
                    HttpMethod.POST,
                    "/api/courses"
                ).hasAnyRole("ADMIN", "INSTRUCTOR")

                .requestMatchers(
                    HttpMethod.PUT,
                    "/api/courses/**"
                ).hasAnyRole("ADMIN", "INSTRUCTOR")

                .requestMatchers(
                    HttpMethod.DELETE,
                    "/api/courses/**"
                ).hasAnyRole("ADMIN", "INSTRUCTOR")

                .requestMatchers(
                    HttpMethod.GET,
                    "/api/enrollments/my-courses"
                ).hasRole("STUDENT")

                .requestMatchers(
                    HttpMethod.DELETE,
                    "/api/enrollments/my-courses/**"
                ).hasRole("STUDENT")

                .requestMatchers(
                    HttpMethod.POST,
                    "/api/enrollments/**"
                ).hasRole("STUDENT")

                .requestMatchers(
                    HttpMethod.DELETE,
                    "/api/enrollments/**"
                ).hasAnyRole("ADMIN", "INSTRUCTOR")

                .requestMatchers(
                    HttpMethod.GET,
                    "/api/enrollments/**"
                ).hasAnyRole("ADMIN", "INSTRUCTOR")

                .requestMatchers(
                    HttpMethod.GET,
                    "/api/users/students"
                ).hasAnyRole("ADMIN", "INSTRUCTOR")

                .requestMatchers(
                    HttpMethod.PUT,
                    "/api/users/me"
                ).hasAnyRole("INSTRUCTOR", "STUDENT")

                .requestMatchers(
                    "/api/courses/**"
                ).hasRole("ADMIN")

                .requestMatchers("/api/users/**")
                .hasRole("ADMIN")

                .anyRequest().authenticated()
            )
            .exceptionHandling(errors -> errors
                .authenticationEntryPoint(
                    (request, response, exception) -> {
                        response.setStatus(
                            HttpServletResponse.SC_UNAUTHORIZED
                        );
                        response.setContentType(
                            "application/json"
                        );
                        response.getWriter().write(
                            """
                            {
                              "status": 401,
                              "error": "Authentication required"
                            }
                            """
                        );
                    }
                )
                .accessDeniedHandler(
                    (request, response, exception) -> {
                        response.setStatus(
                            HttpServletResponse.SC_FORBIDDEN
                        );
                        response.setContentType(
                            "application/json"
                        );
                        response.getWriter().write(
                            """
                            {
                              "status": 403,
                              "error": "Permission denied"
                            }
                            """
                        );
                    }
                )
            )
            .addFilterBefore(
                jwtFilter,
                UsernamePasswordAuthenticationFilter.class
            );

        return http.build();
    }
}
