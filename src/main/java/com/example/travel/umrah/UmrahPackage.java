package com.example.travel.umrah;

import com.example.travel.common.OwnedEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

@Entity
@Table(name = "umrah_packages")
@SQLDelete(sql = "UPDATE umrah_packages SET deleted = true WHERE id = ?")
@Where(clause = "deleted = false")
public class UmrahPackage extends OwnedEntity {

    @Column(nullable = false)
    private String title;

    private Integer durationDays;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal basePrice;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> config;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> extras;

    private java.math.BigDecimal priceChild;
    private java.math.BigDecimal priceInfant;

    @Column(nullable = false)
    private String status = "draft";

    @Column(name = "contact_person_phone", length = 50)
    private String contactPersonPhone;

    @Column(name = "contact_person_email", length = 100)
    private String contactPersonEmail;

    @Column(name = "package_class", length = 20)
    private String packageClass = "economy";

    @Column(name = "cost_adult")
    private java.math.BigDecimal costAdult;

    @Column(name = "cost_child")
    private java.math.BigDecimal costChild;

    @Column(name = "cost_infant")
    private java.math.BigDecimal costInfant;

    private boolean deleted = false;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public Integer getDurationDays() { return durationDays; }
    public void setDurationDays(Integer durationDays) { this.durationDays = durationDays; }
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
    public BigDecimal getBasePrice() { return basePrice; }
    public void setBasePrice(BigDecimal basePrice) { this.basePrice = basePrice; }
    public Map<String, Object> getConfig() { return config; }
    public void setConfig(Map<String, Object> config) { this.config = config; }
    public Map<String, Object> getExtras() { return extras; }
    public void setExtras(Map<String, Object> extras) { this.extras = extras; }
    public java.math.BigDecimal getPriceChild() { return priceChild; }
    public void setPriceChild(java.math.BigDecimal priceChild) { this.priceChild = priceChild; }
    public java.math.BigDecimal getPriceInfant() { return priceInfant; }
    public void setPriceInfant(java.math.BigDecimal priceInfant) { this.priceInfant = priceInfant; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getContactPersonPhone() { return contactPersonPhone; }
    public void setContactPersonPhone(String contactPersonPhone) { this.contactPersonPhone = contactPersonPhone; }
    public String getContactPersonEmail() { return contactPersonEmail; }
    public void setContactPersonEmail(String contactPersonEmail) { this.contactPersonEmail = contactPersonEmail; }
    public String getPackageClass() { return packageClass; }
    public void setPackageClass(String packageClass) { this.packageClass = packageClass; }
    public java.math.BigDecimal getCostAdult() { return costAdult; }
    public void setCostAdult(java.math.BigDecimal costAdult) { this.costAdult = costAdult; }
    public java.math.BigDecimal getCostChild() { return costChild; }
    public void setCostChild(java.math.BigDecimal costChild) { this.costChild = costChild; }
    public java.math.BigDecimal getCostInfant() { return costInfant; }
    public void setCostInfant(java.math.BigDecimal costInfant) { this.costInfant = costInfant; }
    public boolean isDeleted() { return deleted; }
    public void setDeleted(boolean deleted) { this.deleted = deleted; }
}
