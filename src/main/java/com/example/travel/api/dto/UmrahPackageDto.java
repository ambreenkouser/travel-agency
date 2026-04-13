package com.example.travel.api.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public record UmrahPackageDto(
        Long id,
        String title,
        Integer durationDays,
        LocalDate startDate,
        LocalDate endDate,
        BigDecimal basePrice,
        BigDecimal priceChild,
        BigDecimal priceInfant,
        String status,
        Map<String, Object> config,
        Map<String, Object> extras,
        List<UmrahPackageAirlineDto> airlines
) {}
