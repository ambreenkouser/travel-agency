package com.example.travel.hajj;

import java.math.BigDecimal;
import java.util.Map;

public record HajjPackageRequest(
        String title,
        Integer quotaTotal,
        Integer quotaReserved,
        BigDecimal basePrice,
        Map<String, Object> compliance
) {}
