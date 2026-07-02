package com.example.travel.auth;

import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserLogoRepository extends JpaRepository<UserLogo, Long> {

    // Bulk existence check that never materializes logo_data — safe for list endpoints.
    @Query("select l.userId from UserLogo l where l.userId in :ids")
    List<Long> findExistingUserIds(@Param("ids") Collection<Long> ids);
}
