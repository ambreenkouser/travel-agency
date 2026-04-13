package com.example.travel.api.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record BookingDto(
        Long id,
        String bookableType,
        Long bookableId,
        String status,
        BigDecimal grossTotal,
        BigDecimal netTotal,
        BigDecimal taxTotal,
        String currency,
        Instant createdAt,
        Instant expiresAt,
        List<PassengerDto> passengers,
        Long bookedByUserId,
        String bookedByName,       // resolved from userId; null unless enriched
        String paymentComment,
        Long approvedByUserId,
        BookingPaymentDto payment  // null if no slip submitted yet
) {}
