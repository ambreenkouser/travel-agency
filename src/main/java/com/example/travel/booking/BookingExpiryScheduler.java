package com.example.travel.booking;

import com.example.travel.payment.BookingPaymentRepository;
import java.time.Instant;
import java.util.List;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class BookingExpiryScheduler {

    private final BookingRepository bookingRepository;
    private final BookingPaymentRepository bookingPaymentRepository;
    private final BookingService bookingService;

    public BookingExpiryScheduler(BookingRepository bookingRepository,
                                   BookingPaymentRepository bookingPaymentRepository,
                                   BookingService bookingService) {
        this.bookingRepository = bookingRepository;
        this.bookingPaymentRepository = bookingPaymentRepository;
        this.bookingService = bookingService;
    }

    /**
     * Runs every 60 seconds. Finds PENDING bookings whose expiry has passed
     * and no payment slip has been submitted — auto-cancels them.
     */
    @Scheduled(fixedDelay = 60_000)
    @Transactional
    public void cancelExpiredBookings() {
        List<Booking> expired = bookingRepository
                .findByStatusAndExpiresAtBefore(BookingStatus.PENDING, Instant.now());
        for (Booking b : expired) {
            boolean hasSlip = bookingPaymentRepository.findByBookingId(b.getId()).isPresent();
            if (!hasSlip) {
                bookingService.cancel(b.getId(),
                        "Auto-cancelled: payment slip not submitted before expiry",
                        b.getBookedByUserId()); // system/self-cancel — no ledger entries
            }
        }
    }
}
