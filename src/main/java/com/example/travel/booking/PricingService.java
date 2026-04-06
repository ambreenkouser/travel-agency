package com.example.travel.booking;

import java.math.BigDecimal;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class PricingService {

    public PricingBreakdown calculate(PricingInput input) {
        BigDecimal adult = input.fareAdult().multiply(BigDecimal.valueOf(input.adults()));
        BigDecimal child = input.fareChild().multiply(BigDecimal.valueOf(input.children()));
        BigDecimal infant = input.fareInfant().multiply(BigDecimal.valueOf(input.infants()));
        BigDecimal base = adult.add(child).add(infant);

        int pax = input.adults() + input.children() + input.infants();
        BigDecimal taxes = input.taxPerPassenger().multiply(BigDecimal.valueOf(pax));
        BigDecimal fees = input.fees();
        BigDecimal gross = base.add(taxes).add(fees);
        BigDecimal discounts = input.discounts();
        BigDecimal net = gross.subtract(discounts).max(BigDecimal.ZERO);

        Map<String, Object> snapshot = Map.of(
                "base", base,
                "taxes", taxes,
                "fees", fees,
                "discounts", discounts,
                "gross", gross,
                "net", net
        );
        return new PricingBreakdown(gross, net, taxes, snapshot);
    }
}
