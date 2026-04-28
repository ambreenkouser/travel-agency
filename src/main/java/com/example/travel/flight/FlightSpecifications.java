package com.example.travel.flight;

import com.example.travel.share.ContentShare;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import org.springframework.data.jpa.domain.Specification;

public final class FlightSpecifications {
    private FlightSpecifications() {}

    public static Specification<Flight> ownedByAgency(Long agencyId) {
        return (root, query, cb) -> cb.equal(root.get("agencyId"), agencyId);
    }

    public static Specification<Flight> visibleToAgency(Long agencyId) {
        return (root, query, cb) -> {
            Predicate own = cb.equal(root.get("agencyId"), agencyId);
            Subquery<Long> sub = query.subquery(Long.class);
            Root<ContentShare> cs = sub.from(ContentShare.class);
            sub.select(cs.get("contentId"))
               .where(cb.equal(cs.get("contentType"), "flight"),
                      cb.equal(cs.get("targetAgencyId"), agencyId));
            Predicate shared = root.get("id").in(sub);
            return cb.or(own, shared);
        };
    }

    public static Specification<Flight> byOrigin(String origin) {
        return (root, query, cb) -> {
            if (origin == null || origin.isBlank()) return null;
            Subquery<Long> sub = query.subquery(Long.class);
            Root<FlightLeg> leg = sub.from(FlightLeg.class);
            sub.select(leg.get("flightId"))
               .where(cb.equal(leg.get("legOrder"), 1),
                      cb.equal(cb.upper(leg.get("origin")), origin.toUpperCase().trim()));
            return root.get("id").in(sub);
        };
    }

    public static Specification<Flight> byDestination(String destination) {
        return (root, query, cb) -> {
            if (destination == null || destination.isBlank()) return null;
            Subquery<Long> sub = query.subquery(Long.class);
            Root<FlightLeg> leg = sub.from(FlightLeg.class);
            sub.select(leg.get("flightId"))
               .where(cb.equal(cb.upper(leg.get("destination")), destination.toUpperCase().trim()));
            return root.get("id").in(sub);
        };
    }

    public static Specification<Flight> byAirline(Long airlineId) {
        return (root, query, cb) -> airlineId == null ? null : cb.equal(root.get("airline").get("id"), airlineId);
    }

    public static Specification<Flight> betweenDates(OffsetDateTime from, OffsetDateTime to) {
        return (root, query, cb) -> {
            if (from == null && to == null) return null;
            Subquery<Long> sub = query.subquery(Long.class);
            Root<FlightLeg> leg = sub.from(FlightLeg.class);
            Predicate isFirst = cb.equal(leg.get("legOrder"), 1);
            Predicate datePred;
            if (from != null && to != null) datePred = cb.between(leg.get("departAt"), from, to);
            else if (from != null) datePred = cb.greaterThanOrEqualTo(leg.get("departAt"), from);
            else datePred = cb.lessThanOrEqualTo(leg.get("departAt"), to);
            sub.select(leg.get("flightId")).where(isFirst, datePred);
            return root.get("id").in(sub);
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

    public static Specification<Flight> byStatus(String status) {
        return (root, query, cb) -> status == null ? null : cb.equal(root.get("status"), status);
    }
}
