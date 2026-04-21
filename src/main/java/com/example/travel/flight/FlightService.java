package com.example.travel.flight;

import com.example.travel.tenancy.AgencyContext;
import jakarta.persistence.EntityNotFoundException;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FlightService {

    private final FlightRepository flightRepository;
    private final AirlineRepository airlineRepository;
    private final RouteRepository routeRepository;

    public FlightService(FlightRepository flightRepository,
                         AirlineRepository airlineRepository,
                         RouteRepository routeRepository) {
        this.flightRepository = flightRepository;
        this.airlineRepository = airlineRepository;
        this.routeRepository = routeRepository;
    }

    public Page<Flight> search(Long routeId, Long airlineId,
                               OffsetDateTime from, OffsetDateTime to,
                               BigDecimal min, BigDecimal max,
                               String status, Pageable pageable) {
        Long agencyId = AgencyContext.getCurrentAgencyId();
        Specification<Flight> spec = Specification.where(FlightSpecifications.byAgency(agencyId))
                .and(FlightSpecifications.byRoute(routeId))
                .and(FlightSpecifications.byAirline(airlineId))
                .and(FlightSpecifications.betweenDates(from, to))
                .and(FlightSpecifications.withinPrice(min, max))
                .and(FlightSpecifications.byStatus(status));
        return flightRepository.findAll(spec, pageable);
    }

    public Flight findById(Long id) {
        return flightRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Flight not found: " + id));
    }

    @Transactional
    public Flight create(FlightRequest req) {
        Flight flight = new Flight();
        flight.setAgencyId(AgencyContext.getCurrentAgencyId());
        applyRequest(flight, req);
        return flightRepository.save(flight);
    }

    @Transactional
    public Flight update(Long id, FlightRequest req) {
        Flight flight = findById(id);
        applyRequest(flight, req);
        return flightRepository.save(flight);
    }

    // @SQLDelete on Flight turns this into UPDATE SET deleted=true
    @Transactional
    public void delete(Long id) {
        findById(id); // verify exists and belongs to agency (via @Where filter)
        flightRepository.deleteById(id);
    }

    // kept for backward-compat with old Thymeleaf controller
    public Flight save(Flight flight) {
        flight.setAgencyId(AgencyContext.getCurrentAgencyId());
        return flightRepository.save(flight);
    }

    private void applyRequest(Flight flight, FlightRequest req) {
        if (req.getAirlineId() != null) {
            flight.setAirline(airlineRepository.findById(req.getAirlineId())
                    .orElseThrow(() -> new EntityNotFoundException("Airline not found: " + req.getAirlineId())));
        }
        if (req.getRouteId() != null) {
            flight.setRoute(routeRepository.findById(req.getRouteId())
                    .orElseThrow(() -> new EntityNotFoundException("Route not found: " + req.getRouteId())));
        }
        flight.setDepartAt(req.getDepartAt());
        flight.setArriveAt(req.getArriveAt());
        flight.setFareAdult(req.getFareAdult());
        flight.setFareChild(req.getFareChild());
        flight.setFareInfant(req.getFareInfant());
        flight.setTaxTotal(req.getTaxTotal());
        flight.setBaggageInfo(req.getBaggageInfo());
        flight.setExtras(req.getExtras());
        flight.setStatus(req.getStatus() != null ? req.getStatus() : "draft");
        flight.setSeatQuota(req.getSeatQuota());
    }
}
