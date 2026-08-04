package com.studentmanagement.backend.exception;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>>
        handleValidation(
            MethodArgumentNotValidException exception
        ) {

        Map<String, String> fields =
            new LinkedHashMap<>();

        exception.getBindingResult()
            .getFieldErrors()
            .forEach(error ->
                fields.putIfAbsent(
                    error.getField(),
                    error.getDefaultMessage()
                )
            );

        Map<String, Object> body =
            new LinkedHashMap<>();

        body.put("timestamp", Instant.now());
        body.put("status", 400);
        body.put("error", "Validation failed");
        body.put("fields", fields);

        return ResponseEntity
            .badRequest()
            .body(body);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, Object>>
        handleBadCredentials() {

        return ResponseEntity
            .status(HttpStatus.UNAUTHORIZED)
            .body(Map.of(
                "status", 401,
                "error", "Invalid email or password"
            ));
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>>
        handleResponseStatus(
            ResponseStatusException exception
        ) {
        String message = exception.getReason() == null
            ? "Request failed"
            : exception.getReason();

        return ResponseEntity
            .status(exception.getStatusCode())
            .body(Map.of(
                "status",
                exception.getStatusCode().value(),
                "error",
                message
            ));
    }
}