package com.example.travel.hotel;

import com.example.travel.tenancy.AgencyContext;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/hotels")
public class HotelRestController {

    private final HotelRepository repository;

    public HotelRestController(HotelRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('flights:view')")
    public List<Hotel> list(@RequestParam(required = false) String city) {
        if (city != null && !city.isBlank()) {
            return repository.findByCityIgnoreCase(city);
        }
        return repository.findAll();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('flights:view')")
    public Hotel get(@PathVariable Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Hotel not found: " + id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('flights:manage')")
    public ResponseEntity<Hotel> create(@RequestBody Hotel hotel) {
        hotel.setAgencyId(AgencyContext.getCurrentAgencyId());
        return ResponseEntity.status(HttpStatus.CREATED).body(repository.save(hotel));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('flights:manage')")
    public Hotel update(@PathVariable Long id, @RequestBody Hotel body) {
        Hotel hotel = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Hotel not found: " + id));
        hotel.setName(body.getName());
        hotel.setCity(body.getCity());
        hotel.setStarRating(body.getStarRating());
        hotel.setDescription(body.getDescription());
        return repository.save(hotel);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('flights:manage')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
