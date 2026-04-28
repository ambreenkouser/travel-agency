package com.example.travel.custom;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.io.Serializable;
import java.util.Objects;

@Entity
@Table(name = "custom_package_user_grants")
public class CustomPackageUserGrant {

    @EmbeddedId
    private CustomPackageUserGrantId id;

    public CustomPackageUserGrant() {}

    public CustomPackageUserGrant(Long packageId, Long userId) {
        this.id = new CustomPackageUserGrantId(packageId, userId);
    }

    public Long getPackageId() { return id.getPackageId(); }
    public Long getUserId() { return id.getUserId(); }

    @Embeddable
    public static class CustomPackageUserGrantId implements Serializable {
        @Column(name = "package_id")
        private Long packageId;
        @Column(name = "user_id")
        private Long userId;

        public CustomPackageUserGrantId() {}
        public CustomPackageUserGrantId(Long packageId, Long userId) {
            this.packageId = packageId;
            this.userId = userId;
        }
        public Long getPackageId() { return packageId; }
        public Long getUserId() { return userId; }

        @Override public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof CustomPackageUserGrantId other)) return false;
            return Objects.equals(packageId, other.packageId) && Objects.equals(userId, other.userId);
        }
        @Override public int hashCode() { return Objects.hash(packageId, userId); }
    }
}
