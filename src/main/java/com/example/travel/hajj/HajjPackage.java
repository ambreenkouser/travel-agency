package com.example.travel.hajj;

import com.example.travel.common.OwnedEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.util.Map;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "hajj_packages")
@SQLDelete(sql = "UPDATE hajj_packages SET deleted = true WHERE id = ?")
@Where(clause = "deleted = false")
public class HajjPackage extends OwnedEntity {

    @Column(nullable = false)
    private String title;

    private Integer quotaTotal;
    private Integer quotaReserved;
    private BigDecimal basePrice;
    private BigDecimal priceChild;
    private BigDecimal priceInfant;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> compliance;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> extras;

    @Column(name = "contact_person_phone", length = 50)
    private String contactPersonPhone;

    @Column(name = "contact_person_email", length = 100)
    private String contactPersonEmail;

    @Column(name = "package_class", length = 20)
    private String packageClass = "economy";

    @Column(name = "cost_adult")
    private BigDecimal costAdult;

    @Column(name = "cost_child")
    private BigDecimal costChild;

    @Column(name = "cost_infant")
    private BigDecimal costInfant;

    private boolean deleted = false;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public Integer getQuotaTotal() { return quotaTotal; }
    public void setQuotaTotal(Integer quotaTotal) { this.quotaTotal = quotaTotal; }
    public Integer getQuotaReserved() { return quotaReserved; }
    public void setQuotaReserved(Integer quotaReserved) { this.quotaReserved = quotaReserved; }
    public BigDecimal getBasePrice() { return basePrice; }
    public void setBasePrice(BigDecimal basePrice) { this.basePrice = basePrice; }
    public BigDecimal getPriceChild() { return priceChild; }
    public void setPriceChild(BigDecimal priceChild) { this.priceChild = priceChild; }
    public BigDecimal getPriceInfant() { return priceInfant; }
    public void setPriceInfant(BigDecimal priceInfant) { this.priceInfant = priceInfant; }
    public Map<String, Object> getCompliance() { return compliance; }
    public void setCompliance(Map<String, Object> compliance) { this.compliance = compliance; }
    public Map<String, Object> getExtras() { return extras; }
    public void setExtras(Map<String, Object> extras) { this.extras = extras; }
    public String getContactPersonPhone() { return contactPersonPhone; }
    public void setContactPersonPhone(String contactPersonPhone) { this.contactPersonPhone = contactPersonPhone; }
    public String getContactPersonEmail() { return contactPersonEmail; }
    public void setContactPersonEmail(String contactPersonEmail) { this.contactPersonEmail = contactPersonEmail; }
    public String getPackageClass() { return packageClass; }
    public void setPackageClass(String packageClass) { this.packageClass = packageClass; }
    public BigDecimal getCostAdult() { return costAdult; }
    public void setCostAdult(BigDecimal costAdult) { this.costAdult = costAdult; }
    public BigDecimal getCostChild() { return costChild; }
    public void setCostChild(BigDecimal costChild) { this.costChild = costChild; }
    public BigDecimal getCostInfant() { return costInfant; }
    public void setCostInfant(BigDecimal costInfant) { this.costInfant = costInfant; }
    public boolean isDeleted() { return deleted; }
    public void setDeleted(boolean deleted) { this.deleted = deleted; }
}
