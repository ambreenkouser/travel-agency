package com.example.travel.booking;

import com.example.travel.common.TenantedEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "bookings")
@SQLDelete(sql = "UPDATE bookings SET deleted = true WHERE id = ?")
@Where(clause = "deleted = false")
public class Booking extends TenantedEntity {

    @Column(nullable = false)
    private String bookableType; // flight | umrah | hajj

    @Column(nullable = false)
    private Long bookableId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BookingStatus status = BookingStatus.PENDING;

    private BigDecimal grossTotal;
    private BigDecimal netTotal;
    private BigDecimal taxTotal;
    private String currency = "PKR";

    private Long bookedByUserId;

    // For umrah bookings — tracks which airline the passenger booked with
    private Long selectedAirlineId;

    // For bookings with hotel extra — tracks the selected hotel
    private Long selectedHotelId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> pricingSnapshot;

    @Column(name = "expires_at")
    private Instant expiresAt;

    @Column(name = "payment_comment")
    private String paymentComment;

    @Column(name = "approved_by_user_id")
    private Long approvedByUserId;

    private boolean deleted = false;

    @OneToMany(mappedBy = "booking")
    private List<Passenger> passengers = new ArrayList<>();

    public String getBookableType() { return bookableType; }
    public void setBookableType(String bookableType) { this.bookableType = bookableType; }
    public Long getBookableId() { return bookableId; }
    public void setBookableId(Long bookableId) { this.bookableId = bookableId; }
    public BookingStatus getStatus() { return status; }
    public void setStatus(BookingStatus status) { this.status = status; }
    public BigDecimal getGrossTotal() { return grossTotal; }
    public void setGrossTotal(BigDecimal grossTotal) { this.grossTotal = grossTotal; }
    public BigDecimal getNetTotal() { return netTotal; }
    public void setNetTotal(BigDecimal netTotal) { this.netTotal = netTotal; }
    public BigDecimal getTaxTotal() { return taxTotal; }
    public void setTaxTotal(BigDecimal taxTotal) { this.taxTotal = taxTotal; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public Long getBookedByUserId() { return bookedByUserId; }
    public void setBookedByUserId(Long bookedByUserId) { this.bookedByUserId = bookedByUserId; }
    public Long getSelectedAirlineId() { return selectedAirlineId; }
    public void setSelectedAirlineId(Long selectedAirlineId) { this.selectedAirlineId = selectedAirlineId; }
    public Long getSelectedHotelId() { return selectedHotelId; }
    public void setSelectedHotelId(Long selectedHotelId) { this.selectedHotelId = selectedHotelId; }
    public Map<String, Object> getPricingSnapshot() { return pricingSnapshot; }
    public void setPricingSnapshot(Map<String, Object> pricingSnapshot) { this.pricingSnapshot = pricingSnapshot; }
    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }
    public String getPaymentComment() { return paymentComment; }
    public void setPaymentComment(String paymentComment) { this.paymentComment = paymentComment; }
    public Long getApprovedByUserId() { return approvedByUserId; }
    public void setApprovedByUserId(Long approvedByUserId) { this.approvedByUserId = approvedByUserId; }
    public boolean isDeleted() { return deleted; }
    public void setDeleted(boolean deleted) { this.deleted = deleted; }
    public List<Passenger> getPassengers() { return passengers; }
    public void setPassengers(List<Passenger> passengers) { this.passengers = passengers; }
}
