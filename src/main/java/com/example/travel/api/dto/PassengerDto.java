package com.example.travel.api.dto;

import java.time.LocalDate;

public record PassengerDto(
        Long id,
        String type,
        String firstName,
        String lastName,
        String passportNo,
        String nationality,
        LocalDate dateOfBirth,
        String seatNo
) {}
