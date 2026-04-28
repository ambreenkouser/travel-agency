package com.example.travel.booking;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class PricingService {

    /**
     * Calculates a full pricing breakdown from a PricingInput.
     *
     * Totals:
     *   base   = (fareAdult × adults) + (fareChild × children) + (fareInfant × infants)
     *   taxes  = taxPerPassenger × totalPax
     *   gross  = base + taxes + fees
     *   net    = gross − discounts  (floor at 0)
     *
     * All values are rounded to 2 decimal places.
     */
    public PricingBreakdown calculate(PricingInput input) {
        if (input.adults() < 0 || input.children() < 0 || input.infants() < 0) {
            throw new IllegalArgumentException("Passenger counts cannot be negative");
        }
        if (input.fareAdult() == null || input.fareAdult().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Adult fare must be zero or positive");
        }

        BigDecimal adultTotal  = input.fareAdult().multiply(bd(input.adults()));
        BigDecimal childTotal  = input.fareChild().multiply(bd(input.children()));
        BigDecimal infantTotal = input.fareInfant().multiply(bd(input.infants()));
        BigDecimal base        = adultTotal.add(childTotal).add(infantTotal).setScale(2, RoundingMode.HALF_UP);

        int totalPax     = input.adults() + input.children() + input.infants();
        BigDecimal taxes = input.taxPerPassenger().multiply(bd(totalPax)).setScale(2, RoundingMode.HALF_UP);
        BigDecimal fees  = input.fees().setScale(2, RoundingMode.HALF_UP);
        BigDecimal gross = base.add(taxes).add(fees).setScale(2, RoundingMode.HALF_UP);

        BigDecimal discounts = input.discounts().setScale(2, RoundingMode.HALF_UP);
        BigDecimal net       = gross.subtract(discounts).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);

        Map<String, Object> snapshot = new LinkedHashMap<>();
        snapshot.put("adults",    input.adults());
        snapshot.put("children",  input.children());
        snapshot.put("infants",   input.infants());
        snapshot.put("fareAdult", input.fareAdult());
        snapshot.put("fareChild", input.fareChild());
        snapshot.put("fareInfant",input.fareInfant());
        snapshot.put("base",      base);
        snapshot.put("taxes",     taxes);
        snapshot.put("fees",      fees);
        snapshot.put("discounts", discounts);
        snapshot.put("gross",     gross);
        snapshot.put("net",       net);

        return new PricingBreakdown(gross, net, taxes, snapshot);
    }

    private static BigDecimal bd(int n) {
        return BigDecimal.valueOf(n);
    }
}
