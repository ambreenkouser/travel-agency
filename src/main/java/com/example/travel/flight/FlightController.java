package com.example.travel.flight;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
@RequestMapping("/flights")
public class FlightController {

    private final FlightService service;

    public FlightController(FlightService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('flights:view')")
    public String search(@RequestParam(required = false) String origin,
                         @RequestParam(required = false) String destination,
                         @RequestParam(required = false) Long airlineId,
                         @RequestParam(required = false) OffsetDateTime from,
                         @RequestParam(required = false) OffsetDateTime to,
                         @RequestParam(required = false) BigDecimal min,
                         @RequestParam(required = false) BigDecimal max,
                         Pageable pageable,
                         Model model) {
        Page<Flight> flights = service.search(origin, destination, airlineId, from, to, min, max, null, pageable);
        model.addAttribute("flights", flights);
        return "flights/list";
    }

    @PostMapping
    @PreAuthorize("hasAuthority('flights:manage')")
    public String create(Flight flight) {
        service.save(flight);
        return "redirect:/flights";
    }
}
