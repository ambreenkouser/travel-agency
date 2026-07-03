package com.example.travel.api;

import com.example.travel.api.dto.ApiError;
import jakarta.persistence.EntityNotFoundException;
import java.time.Instant;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice(basePackages = "com.example.travel.api")
public class GlobalExceptionHandler {

    @ExceptionHandler(EntityNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ApiError handleNotFound(EntityNotFoundException ex) {
        return new ApiError(404, ex.getMessage(), Instant.now());
    }

    @ExceptionHandler(AccessDeniedException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public ApiError handleForbidden(AccessDeniedException ex) {
        return new ApiError(403, "Access denied", Instant.now());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiError handleBadRequest(IllegalArgumentException ex) {
        return new ApiError(400, ex.getMessage(), Instant.now());
    }

    @ExceptionHandler(IllegalStateException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ApiError handleConflict(IllegalStateException ex) {
        return new ApiError(409, ex.getMessage(), Instant.now());
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    @ResponseStatus(HttpStatus.UNPROCESSABLE_ENTITY)
    public ApiError handleDataIntegrity(DataIntegrityViolationException ex) {
        String msg = ex.getMostSpecificCause().getMessage();
        // Surface the most useful part of DB constraint messages
        if (msg != null && msg.contains("not-null")) {
            return new ApiError(422, "A required field is missing. Please fill all required fields.", Instant.now());
        }
        if (msg != null && msg.contains("unique") || msg != null && msg.contains("duplicate")) {
            return new ApiError(422, "A record with these details already exists.", Instant.now());
        }
        return new ApiError(422, "Data validation failed. Please check all required fields.", Instant.now());
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiError handleUnreadable(HttpMessageNotReadableException ex) {
        return new ApiError(400, ex.getMessage(), Instant.now());
    }

    // Controllers throughout this codebase throw ResponseStatusException directly with a
    // specific reason (e.g. "Cannot delete this account: it has associated bookings or
    // payments."). Without this handler, Spring's default error handling takes over instead of
    // routing through ApiError, and by default omits the "message" field from the JSON response
    // (server.error.include-message defaults to "never"), so the frontend silently falls back to
    // a generic error string even though the specific reason was set correctly server-side.
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiError> handleResponseStatus(ResponseStatusException ex) {
        int status = ex.getStatusCode().value();
        String message = ex.getReason() != null ? ex.getReason() : "Request failed.";
        return ResponseEntity.status(status).body(new ApiError(status, message, Instant.now()));
    }
}
