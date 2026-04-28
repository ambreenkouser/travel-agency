package com.example.travel.custom;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface PackageTypeDefRepository extends JpaRepository<PackageTypeDef, Long> {

    Optional<PackageTypeDef> findBySlug(String slug);

    /** Types granted to a specific agency. */
    @Query("""
        SELECT t FROM PackageTypeDef t
        WHERE t.id IN (
            SELECT g.id.typeDefId FROM AgencyPackageGrant g WHERE g.id.agencyId = :agencyId
        )
        AND t.active = true
        ORDER BY t.name
        """)
    List<PackageTypeDef> findGrantedToAgency(@Param("agencyId") Long agencyId);
}
