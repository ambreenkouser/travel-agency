package com.example.travel.api.dto;

import java.math.BigDecimal;
import java.util.Map;

public record HajjPackageDto(
        Long id,
        String title,
        Integer quotaTotal,
        Integer quotaReserved,
        BigDecimal basePrice,
        BigDecimal priceChild,
        BigDecimal priceInfant,
        Map<String, Object> compliance,
        Map<String, Object> extras,
        String contactPersonPhone,
        String contactPersonEmail,
        String packageClass,
        BigDecimal costAdult,
        BigDecimal costChild,
        BigDecimal costInfant
) {}
