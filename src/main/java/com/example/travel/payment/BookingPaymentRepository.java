package com.example.travel.payment;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookingPaymentRepository extends JpaRepository<BookingPayment, Long> {
    Optional<BookingPayment> findByBookingId(Long bookingId);
}
