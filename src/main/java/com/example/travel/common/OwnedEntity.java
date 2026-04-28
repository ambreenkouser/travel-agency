package com.example.travel.common;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;

/**
 * Base class for entities that are owned by an agency but support
 * cross-agency sharing (flights, Umrah, Hajj packages).
 * Intentionally has NO Hibernate @Filter — visibility is controlled
 * via explicit JPQL queries with OR logic.
 */
@MappedSuperclass
public abstract class OwnedEntity extends AuditableEntity {

    @Column(name = "agency_id", nullable = false)
    private Long agencyId;

    public Long getAgencyId() { return agencyId; }
    public void setAgencyId(Long agencyId) { this.agencyId = agencyId; }
}
