package com.example.travel.payment;

import com.example.travel.common.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "booking_payments")
public class BookingPayment extends AuditableEntity {

    @Column(nullable = false)
    private Long bookingId;

    @Column(nullable = false)
    private Long paymentAccountId;

    private String slipImagePath;

    private String referenceNumber;

    private Long submittedByUserId;

    public Long getBookingId() { return bookingId; }
    public void setBookingId(Long bookingId) { this.bookingId = bookingId; }
    public Long getPaymentAccountId() { return paymentAccountId; }
    public void setPaymentAccountId(Long paymentAccountId) { this.paymentAccountId = paymentAccountId; }
    public String getSlipImagePath() { return slipImagePath; }
    public void setSlipImagePath(String slipImagePath) { this.slipImagePath = slipImagePath; }
    public String getReferenceNumber() { return referenceNumber; }
    public void setReferenceNumber(String referenceNumber) { this.referenceNumber = referenceNumber; }
    public Long getSubmittedByUserId() { return submittedByUserId; }
    public void setSubmittedByUserId(Long submittedByUserId) { this.submittedByUserId = submittedByUserId; }
}
