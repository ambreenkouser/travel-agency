package com.example.travel.api.dto;

import java.time.Instant;

public record BookingPaymentDto(
        Long id,
        Long paymentAccountId,
        String accountName,
        String accountTitle,
        String bankName,
        String bankType,
        String bankAccountNumber,
        String referenceNumber,
        boolean hasSlip,
        Instant submittedAt
) {}
