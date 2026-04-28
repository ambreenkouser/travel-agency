package com.example.travel.hajj;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface HajjPackageRepository extends JpaRepository<HajjPackage, Long> {

    /** Super_admin: only own packages. */
    @Query("SELECT h FROM HajjPackage h WHERE h.deleted = false AND h.agencyId = :agencyId")
    List<HajjPackage> findByAgencyId(@Param("agencyId") Long agencyId);

    /** Agency_admin / sub_agent: own packages OR packages shared to their agency. */
    @Query("""
        SELECT h FROM HajjPackage h WHERE h.deleted = false AND (
            h.agencyId = :agencyId
            OR h.id IN (
                SELECT cs.contentId FROM com.example.travel.share.ContentShare cs
                WHERE cs.contentType = 'hajj' AND cs.targetAgencyId = :agencyId
            )
        )""")
    List<HajjPackage> findVisibleToAgency(@Param("agencyId") Long agencyId);
}
