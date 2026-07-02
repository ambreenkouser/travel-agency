package com.example.travel.auth;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

// Deliberately has NO relationship mapping back to User — this table is only ever
// queried on-demand by its own repository, never joined into a User/auth query.
@Entity
@Table(name = "user_logos")
public class UserLogo {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "logo_data", nullable = false)
    private byte[] logoData;

    @Column(name = "logo_content_type", length = 100)
    private String logoContentType;

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public byte[] getLogoData() {
        return logoData;
    }

    public void setLogoData(byte[] logoData) {
        this.logoData = logoData;
    }

    public String getLogoContentType() {
        return logoContentType;
    }

    public void setLogoContentType(String logoContentType) {
        this.logoContentType = logoContentType;
    }
}
