package com.example.travel.flight;

import com.example.travel.common.TenantedEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "airlines")
public class Airline extends TenantedEntity {

    @Column(name = "created_by_user_id")
    private Long createdByUserId;

    @Column(nullable = false, unique = true, length = 3)
    private String code;

    @Column(nullable = false)
    private String name;

    private Integer seatQuota;

    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    public Long getCreatedByUserId() { return createdByUserId; }
    public void setCreatedByUserId(Long createdByUserId) { this.createdByUserId = createdByUserId; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Integer getSeatQuota() { return seatQuota; }
    public void setSeatQuota(Integer seatQuota) { this.seatQuota = seatQuota; }
    public String getLogoUrl() { return logoUrl; }
    public void setLogoUrl(String logoUrl) { this.logoUrl = logoUrl; }
}
