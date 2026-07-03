package com.example.travel.agency;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface AgencyRepository extends JpaRepository<Agency, Long> {
    Optional<Agency> findBySlug(String slug);
    List<Agency> findByCreatedByUserId(Long userId);
}
