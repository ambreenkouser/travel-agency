package com.example.travel.flight;

import com.example.travel.common.OwnedEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.util.Map;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "flights")
@SQLDelete(sql = "UPDATE flights SET deleted = true WHERE id = ?")
@Where(clause = "deleted = false")
public class Flight extends OwnedEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "airline_id")
    private Airline airline;

    @Column(nullable = false)
    private BigDecimal fareAdult;
    private BigDecimal fareChild;
    private BigDecimal fareInfant;
    private BigDecimal taxTotal;

    // Buying/cost price — visible to super_admin only
    @Column(name = "cost_adult")
    private BigDecimal costAdult;
    @Column(name = "cost_child")
    private BigDecimal costChild;
    @Column(name = "cost_infant")
    private BigDecimal costInfant;

    private String baggageInfo;

    @Column(name = "flight_number", length = 20)
    private String flightNumber;

    @Column(name = "pnr_code", length = 20)
    private String pnrCode;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> extras;

    @Column(nullable = false)
    private String status = "draft";

    @Column(name = "seat_quota")
    private Integer seatQuota;

    @Column(name = "group_name", length = 100)
    private String groupName;

    @Column(name = "contact_person_phone", length = 50)
    private String contactPersonPhone;

    @Column(name = "contact_person_email", length = 100)
    private String contactPersonEmail;

    @Column(name = "flight_class", length = 20)
    private String flightClass = "economy";

    @Column(nullable = false)
    private boolean deleted = false;

    public Airline getAirline() { return airline; }
    public void setAirline(Airline airline) { this.airline = airline; }
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
    public String getFlightNumber() { return flightNumber; }
    public void setFlightNumber(String flightNumber) { this.flightNumber = flightNumber; }
    public String getPnrCode() { return pnrCode; }
    public void setPnrCode(String pnrCode) { this.pnrCode = pnrCode; }
    public Map<String, Object> getExtras() { return extras; }
    public void setExtras(Map<String, Object> extras) { this.extras = extras; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Integer getSeatQuota() { return seatQuota; }
    public void setSeatQuota(Integer seatQuota) { this.seatQuota = seatQuota; }
    public String getGroupName() { return groupName; }
    public void setGroupName(String groupName) { this.groupName = groupName; }
    public String getContactPersonPhone() { return contactPersonPhone; }
    public void setContactPersonPhone(String contactPersonPhone) { this.contactPersonPhone = contactPersonPhone; }
    public String getContactPersonEmail() { return contactPersonEmail; }
    public void setContactPersonEmail(String contactPersonEmail) { this.contactPersonEmail = contactPersonEmail; }
    public String getFlightClass() { return flightClass; }
    public void setFlightClass(String flightClass) { this.flightClass = flightClass; }
    public boolean isDeleted() { return deleted; }
    public void setDeleted(boolean deleted) { this.deleted = deleted; }
}
