package com.example.travel.flight;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Map;

public class FlightRequest {

    private Long airlineId;
    private Long routeId;
    private OffsetDateTime departAt;
    private OffsetDateTime arriveAt;
    private BigDecimal fareAdult;
    private BigDecimal fareChild;
    private BigDecimal fareInfant;
    private BigDecimal taxTotal;
    private String baggageInfo;
    private Map<String, Object> extras;
    private String status = "draft";
    private Integer seatQuota;

    public Long getAirlineId() { return airlineId; }
    public void setAirlineId(Long airlineId) { this.airlineId = airlineId; }
    public Long getRouteId() { return routeId; }
    public void setRouteId(Long routeId) { this.routeId = routeId; }
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
    public Map<String, Object> getExtras() { return extras; }
    public void setExtras(Map<String, Object> extras) { this.extras = extras; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Integer getSeatQuota() { return seatQuota; }
    public void setSeatQuota(Integer seatQuota) { this.seatQuota = seatQuota; }
}
