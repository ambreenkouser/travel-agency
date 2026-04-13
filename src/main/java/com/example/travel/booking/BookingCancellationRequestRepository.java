package com.example.travel.booking;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookingCancellationRequestRepository extends JpaRepository<BookingCancellationRequest, Long> {
    Optional<BookingCancellationRequest> findByBookingIdAndStatus(Long bookingId, String status);
    List<BookingCancellationRequest> findByRequestedByUserIdInAndStatusOrderByCreatedAtDesc(
            List<Long> userIds, String status);
    List<BookingCancellationRequest> findByRequestedByUserIdOrderByCreatedAtDesc(Long userId);
}
