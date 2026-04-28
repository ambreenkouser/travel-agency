package com.example.travel.booking;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping
    @PreAuthorize("hasAuthority('bookings:create')")
    public String create(@RequestBody Booking booking) {
        PricingInput defaultPricing = new PricingInput(
                1, 0, 0,
                booking.getGrossTotal() == null ? java.math.BigDecimal.ZERO : booking.getGrossTotal(),
                java.math.BigDecimal.ZERO,
                java.math.BigDecimal.ZERO,
                java.math.BigDecimal.ZERO,
                java.math.BigDecimal.ZERO,
                java.math.BigDecimal.ZERO
        );
        bookingService.createPending(booking, java.util.Collections.emptyList(), defaultPricing);
        return "redirect:/bookings";
    }

    @PostMapping("/{id}/confirm")
    @PreAuthorize("hasAuthority('bookings:confirm')")
    public String confirm(@PathVariable Long id) {
        bookingService.confirm(id, null, null);
        return "redirect:/bookings";
    }
}
