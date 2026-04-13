package com.example.travel.api.dto;

import java.math.BigDecimal;
import java.util.Map;

public record HajjPackageDto(
        Long id,
        String title,
        Integer quotaTotal,
        Integer quotaReserved,
        BigDecimal basePrice,
        Map<String, Object> compliance
) {}
