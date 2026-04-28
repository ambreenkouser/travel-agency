package com.example.travel.api.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

public record FlightDto(
        Long id,
        String airlineCode,
        String airlineName,
        String airlineLogoUrl,
        String origin,
        String destination,
        OffsetDateTime departAt,
        OffsetDateTime arriveAt,
        BigDecimal fareAdult,
        BigDecimal fareChild,
        BigDecimal fareInfant,
        BigDecimal taxTotal,
        // Buying/cost prices — null for non-super_admin callers
        BigDecimal costAdult,
        BigDecimal costChild,
        BigDecimal costInfant,
        String baggageInfo,
        String flightNumber,
        String pnrCode,
        String groupName,
        String status,
        Map<String, Object> extras,
        Integer seatQuota,
        Integer availableSeats,
        List<FlightLegDto> legs,
        String contactPersonPhone,
        String contactPersonEmail,
        String flightClass
) {}
