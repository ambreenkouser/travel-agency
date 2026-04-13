package com.example.travel.auth;

import com.example.travel.common.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "user_types")
public class UserType extends AuditableEntity {

    @Column(nullable = false, unique = true, length = 50)
    private String name;

    @Column(nullable = false, length = 100)
    private String displayName;

    @Column(nullable = false)
    private int level;

    private String description;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public int getLevel() { return level; }
    public void setLevel(int level) { this.level = level; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
