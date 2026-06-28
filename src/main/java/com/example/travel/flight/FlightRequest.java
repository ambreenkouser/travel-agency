package com.example.travel.flight;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class FlightRequest {

    private BigDecimal fareAdult;
    private BigDecimal fareChild;
    private BigDecimal fareInfant;
    private BigDecimal taxTotal;
    private BigDecimal costAdult;
    private BigDecimal costChild;
    private BigDecimal costInfant;
    private String baggageInfo;
    private Map<String, Object> extras;
    private String status = "draft";
    private Integer seatQuota;
    private String groupName;
    private BigDecimal agentDiscountPercent;
    private String groupType = "ONE_WAY";
    private String sectorOrigin;
    private String sectorDestination;
    private String contactPersonPhone;
    private String contactPersonEmail;
    private List<Long> sharedWith = new ArrayList<>();
    private List<LegRequest> legs = new ArrayList<>();

    public static class LegRequest {
        private String origin;
        private String destination;
        private OffsetDateTime departAt;
        private OffsetDateTime arriveAt;
        private Integer baggageKg;
        private Long airlineId;
        private String flightNumber;
        private String pnrCode;
        private String airlineCode;
        private String flightClass;
        private Integer handCarryKg;

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
        public Long getAirlineId() { return airlineId; }
        public void setAirlineId(Long airlineId) { this.airlineId = airlineId; }
        public String getFlightNumber() { return flightNumber; }
        public void setFlightNumber(String flightNumber) { this.flightNumber = flightNumber; }
        public String getPnrCode() { return pnrCode; }
        public void setPnrCode(String pnrCode) { this.pnrCode = pnrCode; }
        public String getAirlineCode() { return airlineCode; }
        public void setAirlineCode(String airlineCode) { this.airlineCode = airlineCode; }
        public String getFlightClass() { return flightClass; }
        public void setFlightClass(String flightClass) { this.flightClass = flightClass; }
        public Integer getHandCarryKg() { return handCarryKg; }
        public void setHandCarryKg(Integer handCarryKg) { this.handCarryKg = handCarryKg; }
    }

    public BigDecimal getFareAdult() { return fareAdult; }
    public void setFareAdult(BigDecimal fareAdult) { this.fareAdult = fareAdult; }
    public BigDecimal getFareChild() { return fareChild; }
    public void setFareChild(BigDecimal fareChild) { this.fareChild = fareChild; }
    public BigDecimal getFareInfant() { return fareInfant; }
    public void setFareInfant(BigDecimal fareInfant) { this.fareInfant = fareInfant; }
    public BigDecimal getTaxTotal() { return taxTotal; }
    public void setTaxTotal(BigDecimal taxTotal) { this.taxTotal = taxTotal; }
    public BigDecimal getCostAdult() { return costAdult; }
    public void setCostAdult(BigDecimal costAdult) { this.costAdult = costAdult; }
    public BigDecimal getCostChild() { return costChild; }
    public void setCostChild(BigDecimal costChild) { this.costChild = costChild; }
    public BigDecimal getCostInfant() { return costInfant; }
    public void setCostInfant(BigDecimal costInfant) { this.costInfant = costInfant; }
    public String getBaggageInfo() { return baggageInfo; }
    public void setBaggageInfo(String baggageInfo) { this.baggageInfo = baggageInfo; }
    public Map<String, Object> getExtras() { return extras; }
    public void setExtras(Map<String, Object> extras) { this.extras = extras; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Integer getSeatQuota() { return seatQuota; }
    public void setSeatQuota(Integer seatQuota) { this.seatQuota = seatQuota; }
    public String getGroupName() { return groupName; }
    public void setGroupName(String groupName) { this.groupName = groupName; }
    public BigDecimal getAgentDiscountPercent() { return agentDiscountPercent; }
    public void setAgentDiscountPercent(BigDecimal agentDiscountPercent) { this.agentDiscountPercent = agentDiscountPercent; }
    public String getGroupType() { return groupType; }
    public void setGroupType(String groupType) { this.groupType = groupType; }
    public String getSectorOrigin() { return sectorOrigin; }
    public void setSectorOrigin(String sectorOrigin) { this.sectorOrigin = sectorOrigin; }
    public String getSectorDestination() { return sectorDestination; }
    public void setSectorDestination(String sectorDestination) { this.sectorDestination = sectorDestination; }
    public String getContactPersonPhone() { return contactPersonPhone; }
    public void setContactPersonPhone(String contactPersonPhone) { this.contactPersonPhone = contactPersonPhone; }
    public String getContactPersonEmail() { return contactPersonEmail; }
    public void setContactPersonEmail(String contactPersonEmail) { this.contactPersonEmail = contactPersonEmail; }
    public List<Long> getSharedWith() { return sharedWith; }
    public void setSharedWith(List<Long> sharedWith) { this.sharedWith = sharedWith != null ? sharedWith : new ArrayList<>(); }
    public List<LegRequest> getLegs() { return legs; }
    public void setLegs(List<LegRequest> legs) { this.legs = legs != null ? legs : new ArrayList<>(); }
}
