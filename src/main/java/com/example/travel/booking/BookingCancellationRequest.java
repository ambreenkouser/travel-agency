package com.example.travel.booking;

import com.example.travel.common.TenantedEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "booking_cancellation_requests")
public class BookingCancellationRequest extends TenantedEntity {

    @Column(name = "booking_id", nullable = false)
    private Long bookingId;

    @Column(name = "requested_by_user_id")
    private Long requestedByUserId;

    /** PENDING | APPROVED | REJECTED */
    @Column(nullable = false)
    private String status = "PENDING";

    private String reason;

    @Column(name = "parent_comment")
    private String parentComment;

    public Long getBookingId() { return bookingId; }
    public void setBookingId(Long bookingId) { this.bookingId = bookingId; }
    public Long getRequestedByUserId() { return requestedByUserId; }
    public void setRequestedByUserId(Long requestedByUserId) { this.requestedByUserId = requestedByUserId; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public String getParentComment() { return parentComment; }
    public void setParentComment(String parentComment) { this.parentComment = parentComment; }
}
