package com.example.travel.flight;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FlightRepository extends JpaRepository<Flight, Long>, JpaSpecificationExecutor<Flight> {

    /** Eagerly fetches airline so logo is available without an open session (e.g. PDF generation). */
    @Query("SELECT f FROM Flight f LEFT JOIN FETCH f.airline WHERE f.id = :id AND f.deleted = false")
    Optional<Flight> findByIdWithAirline(@Param("id") Long id);

    /** Super_admin: only own flights. */
    @Query("SELECT f FROM Flight f WHERE f.deleted = false AND f.agencyId = :agencyId")
    List<Flight> findByAgencyId(@Param("agencyId") Long agencyId);

    /** Agency_admin / sub_agent: own flights OR flights shared to their agency by super_admin. */
    @Query("""
        SELECT f FROM Flight f WHERE f.deleted = false AND (
            f.agencyId = :agencyId
            OR f.id IN (
                SELECT cs.contentId FROM com.example.travel.share.ContentShare cs
                WHERE cs.contentType = 'flight' AND cs.targetAgencyId = :agencyId
            )
        )""")
    List<Flight> findVisibleToAgency(@Param("agencyId") Long agencyId);
}
