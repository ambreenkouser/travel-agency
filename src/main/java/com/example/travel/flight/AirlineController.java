package com.example.travel.flight;

import jakarta.persistence.EntityNotFoundException;
import java.util.List;
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
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/airlines")
public class AirlineController {

    private final AirlineRepository repository;

    public AirlineController(AirlineRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('flights:view')")
    public List<Airline> list() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('flights:view')")
    public Airline get(@PathVariable Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Airline not found: " + id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('flights:manage')")
    public ResponseEntity<Airline> create(@RequestBody Airline airline) {
        airline.setCode(airline.getCode() != null ? airline.getCode().toUpperCase() : null);
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
        return repository.save(airline);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('flights:manage')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
