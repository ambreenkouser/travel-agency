package com.example.travel.api;

import com.example.travel.api.dto.UmrahPackageAirlineDto;
import com.example.travel.api.dto.UmrahPackageDto;
import com.example.travel.booking.Booking;
import com.example.travel.booking.BookingRepository;
import com.example.travel.booking.BookingStatus;
import com.example.travel.booking.PassengerRepository;
import com.example.travel.umrah.UmrahPackage;
import com.example.travel.umrah.UmrahPackageAirline;
import com.example.travel.umrah.UmrahPackageRequest;
import com.example.travel.umrah.UmrahPackageService;
import java.util.List;
import java.util.stream.Collectors;
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
@RequestMapping("/api/umrah-packages")
public class UmrahRestController {

    private final UmrahPackageService service;
    private final BookingRepository bookingRepository;
    private final PassengerRepository passengerRepository;

    public UmrahRestController(UmrahPackageService service,
                               BookingRepository bookingRepository,
                               PassengerRepository passengerRepository) {
        this.service              = service;
        this.bookingRepository    = bookingRepository;
        this.passengerRepository  = passengerRepository;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('umrah:view')")
    public List<UmrahPackageDto> list(
            @RequestParam(required = false) Long airlineId,
            @RequestParam(required = false) String origin,
            @RequestParam(required = false) String destination) {

        return service.findAll().stream()
                .map(pkg -> toDtoWithAirlines(pkg, service.findAirlinesByPackageId(pkg.getId())))
                .filter(dto -> matchesFilter(dto, airlineId, origin, destination))
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('umrah:view')")
    public UmrahPackageDto getById(@PathVariable Long id) {
        UmrahPackage pkg = service.findById(id);
        return toDtoWithAirlines(pkg, service.findAirlinesByPackageId(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('umrah:manage')")
    public ResponseEntity<UmrahPackageDto> create(@RequestBody UmrahPackageRequest req) {
        UmrahPackage saved = service.create(req);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(toDtoWithAirlines(saved, service.findAirlinesByPackageId(saved.getId())));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('umrah:manage')")
    public UmrahPackageDto update(@PathVariable Long id, @RequestBody UmrahPackageRequest req) {
        UmrahPackage saved = service.update(id, req);
        return toDtoWithAirlines(saved, service.findAirlinesByPackageId(saved.getId()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('umrah:manage')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private UmrahPackageDto toDtoWithAirlines(UmrahPackage pkg, List<UmrahPackageAirline> airlines) {
        List<UmrahPackageAirlineDto> airlineDtos = airlines.stream()
                .map(upa -> {
                    int occupied = countOccupied(pkg.getId(), upa.getAirline().getId());
                    int available = Math.max(0, upa.getAllocatedSeats() - occupied);
                    return new UmrahPackageAirlineDto(
                            upa.getId(),
                            upa.getAirline().getId(),
                            upa.getAirline().getCode(),
                            upa.getAirline().getName(),
                            upa.getAirline().getSeatQuota(),
                            upa.getAllocatedSeats(),
                            occupied,
                            available
                    );
                })
                .collect(Collectors.toList());

        return new UmrahPackageDto(
                pkg.getId(),
                pkg.getTitle(),
                pkg.getDurationDays(),
                pkg.getStartDate(),
                pkg.getEndDate(),
                pkg.getBasePrice(),
                pkg.getPriceChild(),
                pkg.getPriceInfant(),
                pkg.getStatus(),
                pkg.getConfig(),
                pkg.getExtras(),
                airlineDtos
        );
    }

    private int countOccupied(Long packageId, Long airlineId) {
        return bookingRepository
                .findByBookableTypeAndBookableId("umrah", packageId)
                .stream()
                .filter(b -> b.getStatus() != BookingStatus.CANCELLED)
                .filter(b -> airlineId.equals(b.getSelectedAirlineId()))
                .mapToInt(b -> passengerRepository.findByBookingId(b.getId()).size())
                .sum();
    }

    private boolean matchesFilter(UmrahPackageDto dto, Long airlineId, String origin, String destination) {
        if (airlineId != null) {
            boolean hasAirline = dto.airlines().stream().anyMatch(a -> airlineId.equals(a.airlineId()));
            if (!hasAirline) return false;
        }
        // origin/destination filter reserved for future when routes are linked to packages
        return true;
    }
}
