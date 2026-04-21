package com.example.travel.booking;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByBookedByUserId(Long userId);
    List<Booking> findByBookableTypeAndBookableId(String bookableType, Long bookableId);
    List<Booking> findByStatus(BookingStatus status);
    List<Booking> findByStatusAndBookedByUserIdIn(BookingStatus status, Collection<Long> userIds);
    List<Booking> findByStatusAndExpiresAtBefore(BookingStatus status, Instant cutoff);
}
