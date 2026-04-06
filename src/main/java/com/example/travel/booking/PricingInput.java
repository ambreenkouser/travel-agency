package com.example.travel.booking;

import java.math.BigDecimal;

public record PricingInput(
        int adults,
        int children,
        int infants,
        BigDecimal fareAdult,
        BigDecimal fareChild,
        BigDecimal fareInfant,
        BigDecimal taxPerPassenger,
        BigDecimal fees,
        BigDecimal discounts
) {
    public PricingInput {
        if (fareChild == null) fareChild = BigDecimal.ZERO;
        if (fareInfant == null) fareInfant = BigDecimal.ZERO;
        if (taxPerPassenger == null) taxPerPassenger = BigDecimal.ZERO;
        if (fees == null) fees = BigDecimal.ZERO;
        if (discounts == null) discounts = BigDecimal.ZERO;
    }
}
