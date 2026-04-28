package com.example.travel.payment;

import com.example.travel.common.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "banks")
public class Bank extends AuditableEntity {

    @Column(nullable = false)
    private String name;

    private String shortName;

    @Column(nullable = false)
    private String type = "BANK"; // BANK | FINTECH | EMI

    private boolean active = true;

    @Column(name = "display_order")
    private int displayOrder = 0;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getShortName() { return shortName; }
    public void setShortName(String shortName) { this.shortName = shortName; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public int getDisplayOrder() { return displayOrder; }
    public void setDisplayOrder(int displayOrder) { this.displayOrder = displayOrder; }
}
