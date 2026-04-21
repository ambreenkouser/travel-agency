package com.example.travel.auth;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    List<User> findByAgencyId(Long agencyId);
    List<User> findByParentId(Long parentId);

    @Query(value = """
            WITH RECURSIVE sub AS (
              SELECT id FROM users WHERE id = :rootId
              UNION ALL
              SELECT u.id FROM users u JOIN sub s ON u.parent_id = s.id
            )
            SELECT * FROM users u WHERE u.id IN (SELECT id FROM sub) AND u.id != :rootId
            """, nativeQuery = true)
    List<User> findSubtree(@Param("rootId") Long rootId);
}
