package com.example.travel.agency;

import java.time.LocalDate;

public class AgencyRequest {

    private String name;
    private String slug;
    private String logoPath;
    private String subscriptionPlan;
    private LocalDate expiresAt;
    private Integer graceDays;
    private boolean active = true;
    private Integer bookingExpiryMinutes;
    private String contactNo;
    private String address;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }
    public String getLogoPath() { return logoPath; }
    public void setLogoPath(String logoPath) { this.logoPath = logoPath; }
    public String getSubscriptionPlan() { return subscriptionPlan; }
    public void setSubscriptionPlan(String subscriptionPlan) { this.subscriptionPlan = subscriptionPlan; }
    public LocalDate getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDate expiresAt) { this.expiresAt = expiresAt; }
    public Integer getGraceDays() { return graceDays; }
    public void setGraceDays(Integer graceDays) { this.graceDays = graceDays; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public Integer getBookingExpiryMinutes() { return bookingExpiryMinutes; }
    public void setBookingExpiryMinutes(Integer bookingExpiryMinutes) { this.bookingExpiryMinutes = bookingExpiryMinutes; }
    public String getContactNo() { return contactNo; }
    public void setContactNo(String contactNo) { this.contactNo = contactNo; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
}
