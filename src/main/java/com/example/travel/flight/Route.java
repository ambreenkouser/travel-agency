package com.example.travel.flight;

import com.example.travel.common.TenantedEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "routes")
public class Route extends TenantedEntity {

    @Column(name = "created_by_user_id")
    private Long createdByUserId;

    @Column(nullable = false)
    private String origin;

    @Column(nullable = false)
    private String destination;

    public Long getCreatedByUserId() { return createdByUserId; }
    public void setCreatedByUserId(Long createdByUserId) { this.createdByUserId = createdByUserId; }
    public String getOrigin() { return origin; }
    public void setOrigin(String origin) { this.origin = origin; }
    public String getDestination() { return destination; }
    public void setDestination(String destination) { this.destination = destination; }
}
