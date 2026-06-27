package com.example.travel.api;

import com.example.travel.api.dto.FlightDto;
import com.example.travel.api.dto.FlightLegDto;
import com.example.travel.booking.BookingRepository;
import com.example.travel.booking.BookingStatus;
import com.example.travel.booking.PassengerRepository;
import com.example.travel.flight.Airline;
import com.example.travel.flight.AirlineRepository;
import com.example.travel.flight.Flight;
import com.example.travel.flight.FlightLeg;
import com.example.travel.flight.FlightLegRepository;
import com.example.travel.flight.FlightRepository;
import com.example.travel.flight.FlightRequest;
import com.example.travel.flight.FlightService;
import org.springframework.security.core.context.SecurityContextHolder;
import jakarta.persistence.EntityNotFoundException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/flights")
public class FlightRestController {

    private final FlightService flightService;
    private final FlightRepository flightRepository;
    private final FlightLegRepository flightLegRepository;
    private final AirlineRepository airlineRepository;
    private final BookingRepository bookingRepository;
    private final PassengerRepository passengerRepository;

    public FlightRestController(FlightService flightService,
                                FlightRepository flightRepository,
                                FlightLegRepository flightLegRepository,
                                AirlineRepository airlineRepository,
                                BookingRepository bookingRepository,
                                PassengerRepository passengerRepository) {
        this.flightService = flightService;
        this.flightRepository = flightRepository;
        this.flightLegRepository = flightLegRepository;
        this.airlineRepository = airlineRepository;
        this.bookingRepository = bookingRepository;
        this.passengerRepository = passengerRepository;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('flights:view')")
    public Page<FlightDto> search(
            @RequestParam(required = false) String origin,
            @RequestParam(required = false) String destination,
            @RequestParam(required = false) LocalDate dateFrom,
            @RequestParam(required = false) LocalDate dateTo,
            @RequestParam(required = false) Long airlineId,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false, defaultValue = "active") String status,
            Pageable pageable) {

        OffsetDateTime from = dateFrom != null ? dateFrom.atStartOfDay().atOffset(ZoneOffset.UTC) : null;
        OffsetDateTime to   = dateTo   != null ? dateTo.plusDays(1).atStartOfDay().atOffset(ZoneOffset.UTC) : null;
        String statusFilter = "all".equalsIgnoreCase(status) ? null : status;

        return flightService.search(origin, destination, airlineId, from, to, minPrice, maxPrice, statusFilter, pageable)
                .map(this::withAvailability);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('flights:view')")
    public FlightDto getById(@PathVariable Long id) {
        Flight flight = flightRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Flight not found: " + id));
        return withAvailability(flight);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('flights:manage')")
    public ResponseEntity<FlightDto> create(@RequestBody FlightRequest req) {
        Flight flight = flightService.create(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(withAvailability(flight));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('flights:manage')")
    public FlightDto update(@PathVariable Long id, @RequestBody FlightRequest req) {
        return withAvailability(flightService.update(id, req));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('flights:manage')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        flightService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/shares")
    @PreAuthorize("hasAuthority('flights:manage')")
    public List<Long> getShares(@PathVariable Long id) {
        return flightService.getShares(id);
    }

    @PutMapping("/{id}/shares")
    @PreAuthorize("hasRole('super_admin')")
    public ResponseEntity<Void> updateShares(@PathVariable Long id, @RequestBody List<Long> agencyIds) {
        flightService.updateShares(id, agencyIds);
        return ResponseEntity.noContent().build();
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private FlightDto buildDto(Flight flight, List<FlightLeg> legs, Integer availableSeats) {
        // Bulk-load airlines referenced by any leg to avoid N+1
        Set<Long> airlineIds = legs.stream()
                .map(FlightLeg::getAirlineId)
                .filter(id -> id != null)
                .collect(Collectors.toSet());
        Map<Long, Airline> airlineMap = airlineRepository.findAllById(airlineIds)
                .stream().collect(Collectors.toMap(Airline::getId, a -> a));

        String origin      = legs.isEmpty() ? null : legs.get(0).getOrigin();
        String destination = legs.isEmpty() ? null : legs.get(legs.size() - 1).getDestination();
        OffsetDateTime departAt = legs.isEmpty() ? null : legs.get(0).getDepartAt();
        OffsetDateTime arriveAt = legs.isEmpty() ? null : legs.get(legs.size() - 1).getArriveAt();

        // Derive flight-level airline display from first leg for the list table
        Airline firstAirline = legs.isEmpty() ? null : airlineMap.get(legs.get(0).getAirlineId());
        String airlineCode    = firstAirline != null ? firstAirline.getCode()    : (legs.isEmpty() ? null : legs.get(0).getAirlineCode());
        String airlineName    = firstAirline != null ? firstAirline.getName()    : null;
        String airlineLogoUrl = firstAirline != null ? firstAirline.getLogoUrl() : null;

        List<FlightLegDto> legDtos = legs.stream().map(l -> {
            Airline a = l.getAirlineId() != null ? airlineMap.get(l.getAirlineId()) : null;
            return new FlightLegDto(
                    l.getLegOrder(), l.getOrigin(), l.getDestination(),
                    l.getDepartAt(), l.getArriveAt(), l.getBaggageKg(),
                    l.getAirlineId(),
                    a != null ? a.getName()    : null,
                    a != null ? a.getLogoUrl() : null,
                    a != null ? a.getCode()    : l.getAirlineCode(),
                    l.getFlightNumber(), l.getPnrCode(),
                    l.getFlightClass(), l.getHandCarryKg()
            );
        }).collect(Collectors.toList());

        boolean canSeeCost = SecurityContextHolder.getContext().getAuthentication()
                .getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("flights:manage"));

        return new FlightDto(
                flight.getId(), airlineCode, airlineName, airlineLogoUrl,
                origin, destination, departAt, arriveAt,
                flight.getFareAdult(), flight.getFareChild(), flight.getFareInfant(),
                flight.getTaxTotal(),
                canSeeCost ? flight.getCostAdult()  : null,
                canSeeCost ? flight.getCostChild()  : null,
                canSeeCost ? flight.getCostInfant() : null,
                flight.getBaggageInfo(),
                flight.getGroupName(),
                flight.getStatus(), flight.getExtras(),
                flight.getSeatQuota(), availableSeats, legDtos,
                flight.getContactPersonPhone(),
                flight.getContactPersonEmail(),
                flight.getGroupType(),
                flight.getSectorOrigin(),
                flight.getSectorDestination()
        );
    }

    private FlightDto withAvailability(Flight flight) {
        List<FlightLeg> legs = flightLegRepository.findByFlightIdOrderByLegOrder(flight.getId());
        if (flight.getSeatQuota() == null) return buildDto(flight, legs, null);
        int occupied = bookingRepository
                .findByBookableTypeAndBookableId("flight", flight.getId())
                .stream()
                .filter(b -> b.getStatus() != BookingStatus.CANCELLED)
                .mapToInt(b -> passengerRepository.findByBookingId(b.getId()).size())
                .sum();
        int available = Math.max(0, flight.getSeatQuota() - occupied);
        return buildDto(flight, legs, available);
    }
}
