package com.example.travel.api.dto;

public record UmrahPackageAirlineDto(
        Long id,
        Long airlineId,
        String airlineCode,
        String airlineName,
        Integer seatQuota,
        int allocatedSeats,
        int occupiedSeats,
        int availableSeats
) {}
