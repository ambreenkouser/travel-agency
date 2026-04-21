package com.example.travel.flight;

import com.example.travel.common.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "routes")
public class Route extends AuditableEntity {

    @Column(nullable = false)
    private String origin;

    @Column(nullable = false)
    private String destination;

    private Integer durationMins;
    private Integer distanceKm;

    @Column(nullable = false)
    private String routeType = "ONE_WAY";

    public String getOrigin() { return origin; }
    public void setOrigin(String origin) { this.origin = origin; }
    public String getDestination() { return destination; }
    public void setDestination(String destination) { this.destination = destination; }
    public Integer getDurationMins() { return durationMins; }
    public void setDurationMins(Integer durationMins) { this.durationMins = durationMins; }
    public Integer getDistanceKm() { return distanceKm; }
    public void setDistanceKm(Integer distanceKm) { this.distanceKm = distanceKm; }
    public String getRouteType() { return routeType; }
    public void setRouteType(String routeType) { this.routeType = routeType != null ? routeType : "ONE_WAY"; }

    public boolean isRoundTrip() { return "ROUND_TRIP".equals(routeType); }
}
