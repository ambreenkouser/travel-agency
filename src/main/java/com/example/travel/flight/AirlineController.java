package com.example.travel.flight;

import com.example.travel.auth.AuthUserDetails;
import com.example.travel.tenancy.AgencyContext;
import com.example.travel.umrah.UmrahPackageAirlineRepository;
import jakarta.persistence.EntityNotFoundException;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/airlines")
public class AirlineController {

    private final AirlineRepository repository;
    private final UmrahPackageAirlineRepository umrahPackageAirlineRepository;

    public AirlineController(AirlineRepository repository,
                              UmrahPackageAirlineRepository umrahPackageAirlineRepository) {
        this.repository = repository;
        this.umrahPackageAirlineRepository = umrahPackageAirlineRepository;
    }

    public record AirlineView(Long id, String code, String name, String logoUrl,
                               Integer seatQuota, int totalAllocated, int remainingQuota) {}

    @GetMapping
    @PreAuthorize("hasAuthority('flights:view')")
    public List<AirlineView> list(@AuthenticationPrincipal AuthUserDetails principal) {
        return repository.findByCreatedByUserId(principal.getUserId()).stream().map(a -> {
            int allocated = umrahPackageAirlineRepository.sumAllocatedSeatsByAirlineId(a.getId());
            int remaining = a.getSeatQuota() != null ? Math.max(0, a.getSeatQuota() - allocated) : 0;
            return new AirlineView(a.getId(), a.getCode(), a.getName(), a.getLogoUrl(),
                    a.getSeatQuota(), allocated, remaining);
        }).collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('flights:view')")
    public Airline get(@PathVariable Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Airline not found: " + id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('flights:manage')")
    public ResponseEntity<Airline> create(@RequestBody Airline airline,
                                          @AuthenticationPrincipal AuthUserDetails principal) {
        airline.setCode(airline.getCode() != null ? airline.getCode().toUpperCase() : null);
        airline.setAgencyId(AgencyContext.getCurrentAgencyId());
        airline.setCreatedByUserId(principal.getUserId());
        return ResponseEntity.status(HttpStatus.CREATED).body(repository.save(airline));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('flights:manage')")
    public Airline update(@PathVariable Long id, @RequestBody Airline body) {
        Airline airline = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Airline not found: " + id));
        airline.setCode(body.getCode() != null ? body.getCode().toUpperCase() : airline.getCode());
        airline.setName(body.getName());
        airline.setSeatQuota(body.getSeatQuota());
        airline.setLogoUrl(body.getLogoUrl());
        return repository.save(airline);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('flights:manage')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
