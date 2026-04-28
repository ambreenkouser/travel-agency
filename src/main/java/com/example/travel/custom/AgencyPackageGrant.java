package com.example.travel.custom;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.io.Serializable;
import java.util.Objects;

@Entity
@Table(name = "agency_package_grants")
public class AgencyPackageGrant {

    @EmbeddedId
    private AgencyPackageGrantId id;

    public AgencyPackageGrant() {}

    public AgencyPackageGrant(Long agencyId, Long typeDefId) {
        this.id = new AgencyPackageGrantId(agencyId, typeDefId);
    }

    public Long getAgencyId() { return id.getAgencyId(); }
    public Long getTypeDefId() { return id.getTypeDefId(); }
    public AgencyPackageGrantId getId() { return id; }

    @Embeddable
    public static class AgencyPackageGrantId implements Serializable {
        @Column(name = "agency_id")
        private Long agencyId;
        @Column(name = "type_def_id")
        private Long typeDefId;

        public AgencyPackageGrantId() {}
        public AgencyPackageGrantId(Long agencyId, Long typeDefId) {
            this.agencyId = agencyId;
            this.typeDefId = typeDefId;
        }
        public Long getAgencyId() { return agencyId; }
        public Long getTypeDefId() { return typeDefId; }

        @Override public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof AgencyPackageGrantId other)) return false;
            return Objects.equals(agencyId, other.agencyId) && Objects.equals(typeDefId, other.typeDefId);
        }
        @Override public int hashCode() { return Objects.hash(agencyId, typeDefId); }
    }
}
