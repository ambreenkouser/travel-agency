package com.example.travel.umrah;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UmrahPackageAirlineRepository extends JpaRepository<UmrahPackageAirline, Long> {
    List<UmrahPackageAirline> findByUmrahPackageId(Long umrahPackageId);
    Optional<UmrahPackageAirline> findByUmrahPackageIdAndAirline_Id(Long umrahPackageId, Long airlineId);
    List<UmrahPackageAirline> findByAirline_Id(Long airlineId);

    /** Direct bulk DELETE — bypasses persistence context so it flushes before the subsequent INSERT. */
    @Modifying
    @Query("DELETE FROM UmrahPackageAirline upa WHERE upa.umrahPackageId = :packageId")
    void deleteByUmrahPackageId(@Param("packageId") Long packageId);
}
