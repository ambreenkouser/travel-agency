package com.example.travel.flight;

import com.example.travel.common.TenantedEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

@Entity
@Table(name = "flights")
@SQLDelete(sql = "UPDATE flights SET deleted = true WHERE id = ?")
@Where(clause = "deleted = false")
public class Flight extends TenantedEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "airline_id")
    private Airline airline;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "route_id")
    private Route route;

    private OffsetDateTime departAt;
    private OffsetDateTime arriveAt;

    @Column(nullable = false)
    private BigDecimal fareAdult;
    private BigDecimal fareChild;
    private BigDecimal fareInfant;
    private BigDecimal taxTotal;

    private String baggageInfo;

    @Column(nullable = false)
    private String status = "draft";

    @Column(nullable = false)
    private boolean deleted = false;

    public Airline getAirline() { return airline; }
    public void setAirline(Airline airline) { this.airline = airline; }
    public Route getRoute() { return route; }
    public void setRoute(Route route) { this.route = route; }
    public OffsetDateTime getDepartAt() { return departAt; }
    public void setDepartAt(OffsetDateTime departAt) { this.departAt = departAt; }
    public OffsetDateTime getArriveAt() { return arriveAt; }
    public void setArriveAt(OffsetDateTime arriveAt) { this.arriveAt = arriveAt; }
    public BigDecimal getFareAdult() { return fareAdult; }
    public void setFareAdult(BigDecimal fareAdult) { this.fareAdult = fareAdult; }
    public BigDecimal getFareChild() { return fareChild; }
    public void setFareChild(BigDecimal fareChild) { this.fareChild = fareChild; }
    public BigDecimal getFareInfant() { return fareInfant; }
    public void setFareInfant(BigDecimal fareInfant) { this.fareInfant = fareInfant; }
    public BigDecimal getTaxTotal() { return taxTotal; }
    public void setTaxTotal(BigDecimal taxTotal) { this.taxTotal = taxTotal; }
    public String getBaggageInfo() { return baggageInfo; }
    public void setBaggageInfo(String baggageInfo) { this.baggageInfo = baggageInfo; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public boolean isDeleted() { return deleted; }
    public void setDeleted(boolean deleted) { this.deleted = deleted; }
}
