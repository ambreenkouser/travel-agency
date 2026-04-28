package com.example.travel.custom;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record CustomPackageRequest(
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
        List<Long> sharedWith,
        List<Long> assignedUserIds
) {
    public CustomPackageRequest {
        if (status == null) status = "draft";
        if (quotaReserved == null) quotaReserved = 0;
        if (packageClass == null) packageClass = "economy";
    }
}
