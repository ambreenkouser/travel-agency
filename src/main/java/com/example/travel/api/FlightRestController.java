package com.example.travel.api;

import com.example.travel.api.dto.FlightDto;
import com.example.travel.api.mapper.FlightMapper;
import com.example.travel.booking.BookingRepository;
import com.example.travel.booking.BookingStatus;
import com.example.travel.booking.PassengerRepository;
import com.example.travel.flight.Flight;
import com.example.travel.flight.FlightRepository;
import com.example.travel.flight.FlightRequest;
import com.example.travel.flight.FlightService;
import com.example.travel.flight.Route;
import com.example.travel.flight.RouteRepository;
import jakarta.persistence.EntityNotFoundException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Optional;
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
    private final RouteRepository routeRepository;
    private final FlightMapper flightMapper;
    private final BookingRepository bookingRepository;
    private final PassengerRepository passengerRepository;

    public FlightRestController(FlightService flightService, FlightRepository flightRepository,
                                RouteRepository routeRepository, FlightMapper flightMapper,
                                BookingRepository bookingRepository,
                                PassengerRepository passengerRepository) {
        this.flightService = flightService;
        this.flightRepository = flightRepository;
        this.routeRepository = routeRepository;
        this.flightMapper = flightMapper;
        this.bookingRepository = bookingRepository;
        this.passengerRepository = passengerRepository;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('flights:view')")
    public Page<FlightDto> search(
            @RequestParam(required = false) String origin,
            @RequestParam(required = false) String destination,
            @RequestParam(required = false) LocalDate date,
            @RequestParam(required = false) Long airlineId,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false, defaultValue = "active") String status,
            Pageable pageable) {

        Long routeId = null;
        if (origin != null && destination != null) {
            Optional<Route> route = routeRepository.findByOriginAndDestination(origin, destination);
            if (route.isPresent()) {
                routeId = route.get().getId();
            } else {
                return Page.empty(pageable);
            }
        }

        OffsetDateTime from = date != null ? date.atStartOfDay().atOffset(ZoneOffset.UTC) : null;
        OffsetDateTime to   = date != null ? date.plusDays(1).atStartOfDay().atOffset(ZoneOffset.UTC) : null;

        String statusFilter = "all".equalsIgnoreCase(status) ? null : status;

        return flightService.search(routeId, airlineId, from, to, minPrice, maxPrice, statusFilter, pageable)
                .map(flight -> withAvailability(flightMapper.toDto(flight), flight));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('flights:view')")
    public FlightDto getById(@PathVariable Long id) {
        Flight flight = flightRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Flight not found: " + id));
        return withAvailability(flightMapper.toDto(flight), flight);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('flights:manage')")
    public ResponseEntity<FlightDto> create(@RequestBody FlightRequest req) {
        Flight flight = flightService.create(req);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(withAvailability(flightMapper.toDto(flight), flight));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('flights:manage')")
    public FlightDto update(@PathVariable Long id, @RequestBody FlightRequest req) {
        Flight flight = flightService.update(id, req);
        return withAvailability(flightMapper.toDto(flight), flight);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('flights:manage')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        flightService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    /** Computes available seats by subtracting PENDING+CONFIRMED bookings from quota. */
    private FlightDto withAvailability(FlightDto dto, Flight flight) {
        if (flight.getSeatQuota() == null) return dto;
        int occupied = bookingRepository
                .findByBookableTypeAndBookableId("flight", flight.getId())
                .stream()
                .filter(b -> b.getStatus() != BookingStatus.CANCELLED)
                .mapToInt(b -> passengerRepository.findByBookingId(b.getId()).size())
                .sum();
        int available = Math.max(0, flight.getSeatQuota() - occupied);
        return new FlightDto(
                dto.id(), dto.airlineCode(), dto.airlineName(),
                dto.origin(), dto.destination(), dto.durationMins(),
                dto.departAt(), dto.arriveAt(),
                dto.fareAdult(), dto.fareChild(), dto.fareInfant(), dto.taxTotal(),
                dto.baggageInfo(), dto.status(), dto.routeType(), dto.extras(),
                dto.seatQuota(), available
        );
    }
}
