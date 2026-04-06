package com.example.travel.flight;

import com.example.travel.tenancy.AgencyContext;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

@Service
public class FlightService {
    private final FlightRepository repository;

    public FlightService(FlightRepository repository) {
        this.repository = repository;
    }

    public Page<Flight> search(Long routeId, Long airlineId, OffsetDateTime from, OffsetDateTime to, BigDecimal min, BigDecimal max, Pageable pageable) {
        Long agencyId = AgencyContext.getCurrentAgencyId();
        Specification<Flight> spec = Specification.where(FlightSpecifications.byAgency(agencyId))
                .and(FlightSpecifications.byRoute(routeId))
                .and(FlightSpecifications.byAirline(airlineId))
                .and(FlightSpecifications.betweenDates(from, to))
                .and(FlightSpecifications.withinPrice(min, max));
        return repository.findAll(spec, pageable);
    }

    public Flight save(Flight flight) {
        flight.setAgencyId(AgencyContext.getCurrentAgencyId());
        return repository.save(flight);
    }
}
