package com.example.travel.api.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record CustomPackageDto(
        Long id,
        Long agencyId,
        Long typeDefId,
        String packageType,
        String title,
        String description,
        BigDecimal basePrice,
        BigDecimal priceChild,
        BigDecimal priceInfant,
        Integer quotaTotal,
        Integer quotaReserved,
        Map<String, Object> attributes,
        Map<String, Object> extras,
        String status,
        String contactPersonPhone,
        String contactPersonEmail,
        String packageClass,
        BigDecimal costAdult,
        BigDecimal costChild,
        BigDecimal costInfant,
        boolean visibleToAll,
        List<Long> assignedUserIds
) {}
