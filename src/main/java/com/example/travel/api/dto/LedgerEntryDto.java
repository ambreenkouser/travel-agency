package com.example.travel.api.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record LedgerEntryDto(
        Long id,
        Long userId,
        String userName,
        Long bookingId,
        String entryType,
        BigDecimal amount,
        String currency,
        String memo,
        Instant createdAt,
        String bookableTitle,     // null for adjustments; resolved from booking otherwise
        // booking-level fields for slide-in detail panel
        Long bookedByUserId,
        String bookedByName,
        Long approvedByUserId,
        String approvedByName,
        String bookingStatus,
        BigDecimal bookingGrossTotal,
        BigDecimal bookingNetTotal,
        String bookableType
) {}
