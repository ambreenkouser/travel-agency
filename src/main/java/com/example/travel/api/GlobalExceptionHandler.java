package com.example.travel.api;

import com.example.travel.api.dto.ApiError;
import jakarta.persistence.EntityNotFoundException;
import java.time.Instant;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

// Unscoped so it covers every controller in the app, not just this package — several
// controllers (AgencyController, AirlineController, RouteRestController, legacy MVC
// controllers) live outside com.example.travel.api and were previously falling through
// to Spring Boot's bare default error page instead of this handler's ApiError format.
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

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

    // Last-resort safety net: anything not matched above previously fell through to Spring
    // Boot's bare default error page with no message at all. Log the real exception server-side
    // (so it's diagnosable) while still giving the client a consistent ApiError response.
    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ApiError handleUnexpected(Exception ex) {
        log.error("Unhandled exception", ex);
        return new ApiError(500, "Something went wrong. Please try again.", Instant.now());
    }
}
