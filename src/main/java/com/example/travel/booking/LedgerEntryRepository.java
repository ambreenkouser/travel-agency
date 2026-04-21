package com.example.travel.booking;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LedgerEntryRepository extends JpaRepository<LedgerEntry, Long> {
    List<LedgerEntry> findByBookingId(Long bookingId);
    List<LedgerEntry> findByAgencyId(Long agencyId);
    List<LedgerEntry> findByUserIdOrderByCreatedAtDesc(Long userId);
}
