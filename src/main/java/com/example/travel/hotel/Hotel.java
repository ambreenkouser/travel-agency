package com.example.travel.hotel;

import com.example.travel.common.TenantedEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "hotels")
public class Hotel extends TenantedEntity {

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, length = 100)
    private String city;

    private Integer starRating;

    @Column(columnDefinition = "TEXT")
    private String description;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public Integer getStarRating() { return starRating; }
    public void setStarRating(Integer starRating) { this.starRating = starRating; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
