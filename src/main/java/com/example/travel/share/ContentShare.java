package com.example.travel.share;

import com.example.travel.common.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "content_shares")
public class ContentShare extends AuditableEntity {

    @Column(name = "content_type", nullable = false, length = 10)
    private String contentType;

    @Column(name = "content_id", nullable = false)
    private Long contentId;

    @Column(name = "target_agency_id", nullable = false)
    private Long targetAgencyId;

    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }
    public Long getContentId() { return contentId; }
    public void setContentId(Long contentId) { this.contentId = contentId; }
    public Long getTargetAgencyId() { return targetAgencyId; }
    public void setTargetAgencyId(Long targetAgencyId) { this.targetAgencyId = targetAgencyId; }
}
