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
        Instant createdAt
) {}
