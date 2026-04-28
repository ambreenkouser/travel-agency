package com.example.travel.api.dto;

import java.time.LocalDate;

public record PassengerRequest(
        String type,
        String firstName,
        String lastName,
        String passportNo,
        String nationality,
        LocalDate dateOfBirth
) {}
