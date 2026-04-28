package com.example.travel.share;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface ContentShareRepository extends JpaRepository<ContentShare, Long> {

    @Query("SELECT cs.targetAgencyId FROM ContentShare cs WHERE cs.contentType = :type AND cs.contentId = :id")
    List<Long> findTargetAgencyIdsByContentTypeAndContentId(@Param("type") String type, @Param("id") Long id);

    @Transactional
    void deleteByContentTypeAndContentId(String contentType, Long contentId);
}
