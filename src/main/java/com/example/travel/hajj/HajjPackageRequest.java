package com.example.travel.hajj;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public record HajjPackageRequest(
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
        BigDecimal costInfant,
        List<Long> sharedWith
) {
    public HajjPackageRequest {
        if (sharedWith == null) sharedWith = new ArrayList<>();
        if (packageClass == null) packageClass = "economy";
    }
}
