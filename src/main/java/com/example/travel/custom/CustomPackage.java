package com.example.travel.custom;

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
@Table(name = "custom_packages")
@SQLDelete(sql = "UPDATE custom_packages SET deleted = true WHERE id = ?")
@Where(clause = "deleted = false")
public class CustomPackage extends OwnedEntity {

    @Column(name = "package_type", nullable = false)
    private String packageType;

    @Column(nullable = false)
    private String title;

    private String description;

    private BigDecimal basePrice;
    private BigDecimal priceChild;
    private BigDecimal priceInfant;

    private Integer quotaTotal;

    @Column(nullable = false)
    private Integer quotaReserved = 0;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> attributes;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> extras;

    @Column(nullable = false)
    private String status = "draft";

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

    @Column(name = "type_def_id")
    private Long typeDefId;

    @Column(nullable = false)
    private boolean visibleToAll = true;

    private boolean deleted = false;

    public String getPackageType() { return packageType; }
    public void setPackageType(String packageType) { this.packageType = packageType; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public BigDecimal getBasePrice() { return basePrice; }
    public void setBasePrice(BigDecimal basePrice) { this.basePrice = basePrice; }

    public BigDecimal getPriceChild() { return priceChild; }
    public void setPriceChild(BigDecimal priceChild) { this.priceChild = priceChild; }

    public BigDecimal getPriceInfant() { return priceInfant; }
    public void setPriceInfant(BigDecimal priceInfant) { this.priceInfant = priceInfant; }

    public Integer getQuotaTotal() { return quotaTotal; }
    public void setQuotaTotal(Integer quotaTotal) { this.quotaTotal = quotaTotal; }

    public Integer getQuotaReserved() { return quotaReserved; }
    public void setQuotaReserved(Integer quotaReserved) { this.quotaReserved = quotaReserved; }

    public Map<String, Object> getAttributes() { return attributes; }
    public void setAttributes(Map<String, Object> attributes) { this.attributes = attributes; }

    public Map<String, Object> getExtras() { return extras; }
    public void setExtras(Map<String, Object> extras) { this.extras = extras; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

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

    public Long getTypeDefId() { return typeDefId; }
    public void setTypeDefId(Long typeDefId) { this.typeDefId = typeDefId; }

    public boolean isVisibleToAll() { return visibleToAll; }
    public void setVisibleToAll(boolean visibleToAll) { this.visibleToAll = visibleToAll; }

    public boolean isDeleted() { return deleted; }
    public void setDeleted(boolean deleted) { this.deleted = deleted; }
}
