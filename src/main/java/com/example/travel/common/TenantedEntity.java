package com.example.travel.common;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.FilterDef;
import org.hibernate.annotations.ParamDef;

@MappedSuperclass
@FilterDef(name = "agencyFilter", parameters = @ParamDef(name = "agencyId", type = Long.class))
@Filter(name = "agencyFilter", condition = "agency_id = :agencyId")
public abstract class TenantedEntity extends AuditableEntity {

    @Column(name = "agency_id", nullable = false)
    private Long agencyId;

    public Long getAgencyId() {
        return agencyId;
    }

    public void setAgencyId(Long agencyId) {
        this.agencyId = agencyId;
    }
}
