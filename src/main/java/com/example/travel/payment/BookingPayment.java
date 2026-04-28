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

    @Column(name = "slip_image_data")
    private byte[] slipImageData;

    @Column(name = "slip_content_type", length = 100)
    private String slipContentType;

    private String referenceNumber;

    private Long submittedByUserId;

    public Long getBookingId() { return bookingId; }
    public void setBookingId(Long bookingId) { this.bookingId = bookingId; }
    public Long getPaymentAccountId() { return paymentAccountId; }
    public void setPaymentAccountId(Long paymentAccountId) { this.paymentAccountId = paymentAccountId; }
    public byte[] getSlipImageData() { return slipImageData; }
    public void setSlipImageData(byte[] slipImageData) { this.slipImageData = slipImageData; }
    public String getSlipContentType() { return slipContentType; }
    public void setSlipContentType(String slipContentType) { this.slipContentType = slipContentType; }
    public String getReferenceNumber() { return referenceNumber; }
    public void setReferenceNumber(String referenceNumber) { this.referenceNumber = referenceNumber; }
    public Long getSubmittedByUserId() { return submittedByUserId; }
    public void setSubmittedByUserId(Long submittedByUserId) { this.submittedByUserId = submittedByUserId; }
}
