package com.example.travel.hajj;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface HajjPackageRepository extends JpaRepository<HajjPackage, Long> {
}
