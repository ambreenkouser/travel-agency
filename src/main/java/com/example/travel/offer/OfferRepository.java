package com.example.travel.offer;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OfferRepository extends JpaRepository<Offer, Long> {
    List<Offer> findByCreatedByUserIdOrderByCreatedAtDesc(Long createdByUserId);
    List<Offer> findByTargetUserIdAndActiveTrueOrderByCreatedAtDesc(Long targetUserId);
    List<Offer> findByTargetUserIdOrderByCreatedAtDesc(Long targetUserId);
}
