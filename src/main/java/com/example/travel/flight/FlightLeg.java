package com.example.travel.flight;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

@Entity
@Table(name = "flight_legs")
public class FlightLeg {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "flight_id", nullable = false)
    private Long flightId;

    @Column(name = "leg_order", nullable = false)
    private Integer legOrder;

    @Column(nullable = false)
    private String origin;

    @Column(nullable = false)
    private String destination;

    private OffsetDateTime departAt;
    private OffsetDateTime arriveAt;

    @Column(name = "baggage_kg")
    private Integer baggageKg;

    public Long getId() { return id; }
    public Long getFlightId() { return flightId; }
    public void setFlightId(Long flightId) { this.flightId = flightId; }
    public Integer getLegOrder() { return legOrder; }
    public void setLegOrder(Integer legOrder) { this.legOrder = legOrder; }
    public String getOrigin() { return origin; }
    public void setOrigin(String origin) { this.origin = origin; }
    public String getDestination() { return destination; }
    public void setDestination(String destination) { this.destination = destination; }
    public OffsetDateTime getDepartAt() { return departAt; }
    public void setDepartAt(OffsetDateTime departAt) { this.departAt = departAt; }
    public OffsetDateTime getArriveAt() { return arriveAt; }
    public void setArriveAt(OffsetDateTime arriveAt) { this.arriveAt = arriveAt; }
    public Integer getBaggageKg() { return baggageKg; }
    public void setBaggageKg(Integer baggageKg) { this.baggageKg = baggageKg; }
}
