package com.example.travel.api.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Map;

public record FlightDto(
        Long id,
        String airlineCode,
        String airlineName,
        String origin,
        String destination,
        Integer durationMins,
        OffsetDateTime departAt,
        OffsetDateTime arriveAt,
        BigDecimal fareAdult,
        BigDecimal fareChild,
        BigDecimal fareInfant,
        BigDecimal taxTotal,
        String baggageInfo,
        String status,
        String routeType,
        Map<String, Object> extras,
        Integer seatQuota,
        Integer availableSeats   // computed; null if no quota set
) {}
