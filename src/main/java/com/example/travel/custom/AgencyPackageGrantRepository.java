package com.example.travel.custom;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface AgencyPackageGrantRepository
        extends JpaRepository<AgencyPackageGrant, AgencyPackageGrant.AgencyPackageGrantId> {

    @Query("SELECT g.id.typeDefId FROM AgencyPackageGrant g WHERE g.id.agencyId = :agencyId")
    List<Long> findTypeDefIdsByAgencyId(@Param("agencyId") Long agencyId);

    @Query("SELECT g.id.agencyId FROM AgencyPackageGrant g WHERE g.id.typeDefId = :typeDefId")
    List<Long> findAgencyIdsByTypeDefId(@Param("typeDefId") Long typeDefId);

    @Transactional
    @Modifying
    @Query("DELETE FROM AgencyPackageGrant g WHERE g.id.typeDefId = :typeDefId")
    void deleteByTypeDefId(@Param("typeDefId") Long typeDefId);
}
