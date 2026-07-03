package com.example.travel.agency;

import com.example.travel.auth.User;
import com.example.travel.common.AuditableEntity;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "agencies")
public class Agency extends AuditableEntity {

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false, unique = true)
    private String slug;

    private String logoPath;

    @Column(name = "logo_data")
    private byte[] logoData;

    @Column(name = "logo_content_type", length = 100)
    private String logoContentType;

    private String subscriptionPlan;

    private LocalDate expiresAt;

    private Integer graceDays;

    private boolean active = true;

    @Column(name = "booking_expiry_minutes")
    private Integer bookingExpiryMinutes = 60;

    @Column(name = "contact_no", length = 50)
    private String contactNo;

    @Column(name = "address", length = 500)
    private String address;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> settings;

    @JsonIgnore
    @OneToMany(mappedBy = "agency", fetch = FetchType.LAZY)
    private List<User> users = new ArrayList<>();

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }
    public String getLogoPath() { return logoPath; }
    public void setLogoPath(String logoPath) { this.logoPath = logoPath; }
    public byte[] getLogoData() { return logoData; }
    public void setLogoData(byte[] logoData) { this.logoData = logoData; }
    public String getLogoContentType() { return logoContentType; }
    public void setLogoContentType(String logoContentType) { this.logoContentType = logoContentType; }
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
    public Map<String, Object> getSettings() { return settings; }
    public void setSettings(Map<String, Object> settings) { this.settings = settings; }
    public List<User> getUsers() { return users; }
}
