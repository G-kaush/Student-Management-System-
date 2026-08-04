package com.studentmanagement.backend.config;

import com.studentmanagement.backend.security.CustomUserDetailsService;
import com.studentmanagement.backend.security.JwtAuthenticationFilter;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
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
                    "/api/auth/login"
                ).permitAll()

                .requestMatchers(
                    HttpMethod.POST,
                    "/api/auth/register"
                ).hasRole("ADMIN")

                .requestMatchers(
                    HttpMethod.GET,
                    "/api/courses/**",
                    "/api/students/**"
                ).hasAnyRole("ADMIN", "INSTRUCTOR")

                .requestMatchers(
                    HttpMethod.POST,
                    "/api/students/**"
                ).hasAnyRole("ADMIN", "INSTRUCTOR")

                .requestMatchers(
                    HttpMethod.PUT,
                    "/api/students/**"
                ).hasAnyRole("ADMIN", "INSTRUCTOR")

                .requestMatchers(
                    HttpMethod.DELETE,
                    "/api/students/**"
                ).hasRole("ADMIN")

                .requestMatchers(
                    "/api/courses/**",
                    "/api/users/**"
                ).hasRole("ADMIN")

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