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
@RequestMapping("/api/routes")
public class RouteRestController {

    private final RouteRepository repository;

    public RouteRestController(RouteRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('flights:view')")
    public List<Route> list() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('flights:view')")
    public Route get(@PathVariable Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Route not found: " + id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('flights:manage')")
    public ResponseEntity<Route> create(@RequestBody Route route) {
        return ResponseEntity.status(HttpStatus.CREATED).body(repository.save(route));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('flights:manage')")
    public Route update(@PathVariable Long id, @RequestBody Route body) {
        Route route = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Route not found: " + id));
        route.setOrigin(body.getOrigin());
        route.setDestination(body.getDestination());
        route.setDurationMins(body.getDurationMins());
        route.setDistanceKm(body.getDistanceKm());
        route.setRouteType(body.getRouteType());
        return repository.save(route);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('flights:manage')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
