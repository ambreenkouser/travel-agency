package com.example.travel.custom;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface CustomPackageUserGrantRepository
        extends JpaRepository<CustomPackageUserGrant, CustomPackageUserGrant.CustomPackageUserGrantId> {

    @Query("SELECT g.id.userId FROM CustomPackageUserGrant g WHERE g.id.packageId = :packageId")
    List<Long> findUserIdsByPackageId(@Param("packageId") Long packageId);

    @Query("SELECT g.id.packageId FROM CustomPackageUserGrant g WHERE g.id.userId = :userId")
    List<Long> findPackageIdsByUserId(@Param("userId") Long userId);

    @Transactional
    @Modifying
    @Query("DELETE FROM CustomPackageUserGrant g WHERE g.id.packageId = :packageId")
    void deleteByPackageId(@Param("packageId") Long packageId);
}
