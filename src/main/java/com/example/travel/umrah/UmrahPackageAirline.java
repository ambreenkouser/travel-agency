package com.example.travel.umrah;

import com.example.travel.common.AuditableEntity;
import com.example.travel.flight.Airline;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "umrah_package_airlines")
public class UmrahPackageAirline extends AuditableEntity {

    @Column(nullable = false, name = "umrah_package_id")
    private Long umrahPackageId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "airline_id", nullable = false)
    private Airline airline;

    @Column(nullable = false)
    private int allocatedSeats;

    public Long getUmrahPackageId() { return umrahPackageId; }
    public void setUmrahPackageId(Long umrahPackageId) { this.umrahPackageId = umrahPackageId; }
    public Airline getAirline() { return airline; }
    public void setAirline(Airline airline) { this.airline = airline; }
    public int getAllocatedSeats() { return allocatedSeats; }
    public void setAllocatedSeats(int allocatedSeats) { this.allocatedSeats = allocatedSeats; }
}
