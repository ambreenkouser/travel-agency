package com.example.travel.flight;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import org.springframework.data.jpa.domain.Specification;

public final class FlightSpecifications {
    private FlightSpecifications() {}

    public static Specification<Flight> byAgency(Long agencyId) {
        return (root, query, cb) -> cb.equal(root.get("agencyId"), agencyId);
    }

    public static Specification<Flight> byRoute(Long routeId) {
        return (root, query, cb) -> routeId == null ? null : cb.equal(root.get("route").get("id"), routeId);
    }

    public static Specification<Flight> byAirline(Long airlineId) {
        return (root, query, cb) -> airlineId == null ? null : cb.equal(root.get("airline").get("id"), airlineId);
    }

    public static Specification<Flight> betweenDates(OffsetDateTime from, OffsetDateTime to) {
        return (root, query, cb) -> {
            if (from == null && to == null) return null;
            if (from != null && to != null) return cb.between(root.get("departAt"), from, to);
            if (from != null) return cb.greaterThanOrEqualTo(root.get("departAt"), from);
            return cb.lessThanOrEqualTo(root.get("departAt"), to);
        };
    }

    public static Specification<Flight> withinPrice(BigDecimal min, BigDecimal max) {
        return (root, query, cb) -> {
            if (min == null && max == null) return null;
            if (min != null && max != null) return cb.between(root.get("fareAdult"), min, max);
            if (min != null) return cb.greaterThanOrEqualTo(root.get("fareAdult"), min);
            return cb.lessThanOrEqualTo(root.get("fareAdult"), max);
        };
    }
}
