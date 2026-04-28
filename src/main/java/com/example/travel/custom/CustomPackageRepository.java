package com.example.travel.custom;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface CustomPackageRepository extends JpaRepository<CustomPackage, Long> {

    /** Super_admin: only own packages. */
    @Query("SELECT c FROM CustomPackage c WHERE c.deleted = false AND c.agencyId = :agencyId")
    List<CustomPackage> findByAgencyId(@Param("agencyId") Long agencyId);

    /** Packages of a specific type def for an agency. */
    @Query("SELECT c FROM CustomPackage c WHERE c.deleted = false AND c.agencyId = :agencyId AND c.typeDefId = :typeDefId")
    List<CustomPackage> findByAgencyIdAndTypeDefId(@Param("agencyId") Long agencyId, @Param("typeDefId") Long typeDefId);

    /** Agency users: own packages OR packages shared to their agency. */
    @Query("""
        SELECT c FROM CustomPackage c WHERE c.deleted = false AND (
            c.agencyId = :agencyId
            OR c.id IN (
                SELECT cs.contentId FROM com.example.travel.share.ContentShare cs
                WHERE cs.contentType = 'custom' AND cs.targetAgencyId = :agencyId
            )
        )""")
    List<CustomPackage> findVisibleToAgency(@Param("agencyId") Long agencyId);

    /**
     * Sub-agent: active packages visible to them — either visible_to_all = true
     * or they have an explicit user grant.
     */
    @Query("""
        SELECT c FROM CustomPackage c WHERE c.deleted = false AND c.status = 'active'
        AND c.agencyId = :agencyId AND (
            c.visibleToAll = true
            OR c.id IN (
                SELECT g.id.packageId FROM CustomPackageUserGrant g WHERE g.id.userId = :userId
            )
        )""")
    List<CustomPackage> findVisibleToUser(@Param("agencyId") Long agencyId, @Param("userId") Long userId);
}
