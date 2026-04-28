package com.example.travel.api.dto;

import java.time.OffsetDateTime;

public record FlightLegDto(
        Integer legOrder,
        String origin,
        String destination,
        OffsetDateTime departAt,
        OffsetDateTime arriveAt,
        Integer baggageKg
) {}
