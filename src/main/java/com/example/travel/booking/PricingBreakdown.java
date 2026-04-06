package com.example.travel.booking;

import java.math.BigDecimal;
import java.util.Map;

public record PricingBreakdown(BigDecimal gross, BigDecimal net, BigDecimal tax, Map<String, Object> components) {}
