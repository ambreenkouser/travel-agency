package com.example.travel.hajj;

import com.example.travel.common.TenantedEntity;
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
public class HajjPackage extends TenantedEntity {

    @Column(nullable = false)
    private String title;

    private Integer quotaTotal;
    private Integer quotaReserved;
    private BigDecimal basePrice;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> compliance;

    private boolean deleted = false;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public Integer getQuotaTotal() { return quotaTotal; }
    public void setQuotaTotal(Integer quotaTotal) { this.quotaTotal = quotaTotal; }
    public Integer getQuotaReserved() { return quotaReserved; }
    public void setQuotaReserved(Integer quotaReserved) { this.quotaReserved = quotaReserved; }
    public BigDecimal getBasePrice() { return basePrice; }
    public void setBasePrice(BigDecimal basePrice) { this.basePrice = basePrice; }
    public Map<String, Object> getCompliance() { return compliance; }
    public void setCompliance(Map<String, Object> compliance) { this.compliance = compliance; }
    public boolean isDeleted() { return deleted; }
    public void setDeleted(boolean deleted) { this.deleted = deleted; }
}
