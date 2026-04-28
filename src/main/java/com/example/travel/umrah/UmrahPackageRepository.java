package com.example.travel.umrah;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UmrahPackageRepository extends JpaRepository<UmrahPackage, Long> {

    /** Super_admin: only own packages. */
    @Query("SELECT u FROM UmrahPackage u WHERE u.deleted = false AND u.agencyId = :agencyId")
    List<UmrahPackage> findByAgencyId(@Param("agencyId") Long agencyId);

    /** Agency_admin / sub_agent: own packages OR packages shared to their agency. */
    @Query("""
        SELECT u FROM UmrahPackage u WHERE u.deleted = false AND (
            u.agencyId = :agencyId
            OR u.id IN (
                SELECT cs.contentId FROM com.example.travel.share.ContentShare cs
                WHERE cs.contentType = 'umrah' AND cs.targetAgencyId = :agencyId
            )
        )""")
    List<UmrahPackage> findVisibleToAgency(@Param("agencyId") Long agencyId);
}
