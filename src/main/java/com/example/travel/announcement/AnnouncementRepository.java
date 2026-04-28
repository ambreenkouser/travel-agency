package com.example.travel.announcement;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {

    @Query(value = "SELECT * FROM announcements WHERE target_type = :targetType AND active = true ORDER BY created_at DESC", nativeQuery = true)
    List<Announcement> findByTargetType(@Param("targetType") String targetType);

    @Query(value = "SELECT * FROM announcements WHERE target_type = :targetType AND created_by_user_id = :createdByUserId AND active = true ORDER BY created_at DESC", nativeQuery = true)
    List<Announcement> findByTargetTypeAndCreator(@Param("targetType") String targetType, @Param("createdByUserId") Long createdByUserId);

    @Query(value = "SELECT * FROM announcements WHERE created_by_user_id = :createdByUserId AND active = true ORDER BY created_at DESC", nativeQuery = true)
    List<Announcement> findSentByUser(@Param("createdByUserId") Long createdByUserId);

    Optional<Announcement> findByIdAndCreatedByUserId(Long id, Long createdByUserId);
}
