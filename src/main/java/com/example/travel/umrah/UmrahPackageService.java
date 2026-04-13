package com.example.travel.umrah;

import com.example.travel.flight.Airline;
import com.example.travel.flight.AirlineRepository;
import com.example.travel.tenancy.AgencyContext;
import jakarta.persistence.EntityNotFoundException;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UmrahPackageService {

    private final UmrahPackageRepository repository;
    private final UmrahPackageAirlineRepository airlineRepository;
    private final AirlineRepository airlineMasterRepository;

    public UmrahPackageService(UmrahPackageRepository repository,
                               UmrahPackageAirlineRepository airlineRepository,
                               AirlineRepository airlineMasterRepository) {
        this.repository = repository;
        this.airlineRepository = airlineRepository;
        this.airlineMasterRepository = airlineMasterRepository;
    }

    public List<UmrahPackage> findAll() {
        return repository.findAll();
    }

    public UmrahPackage findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Umrah package not found: " + id));
    }

    @Transactional
    public UmrahPackage create(UmrahPackageRequest req) {
        UmrahPackage pkg = new UmrahPackage();
        pkg.setAgencyId(AgencyContext.getCurrentAgencyId());
        applyFields(pkg, req);
        UmrahPackage saved = repository.save(pkg);
        saveAirlines(saved.getId(), req.getAirlines());
        return saved;
    }

    @Transactional
    public UmrahPackage update(Long id, UmrahPackageRequest req) {
        UmrahPackage pkg = findById(id);
        applyFields(pkg, req);
        UmrahPackage saved = repository.save(pkg);
        airlineRepository.deleteByUmrahPackageId(saved.getId());
        saveAirlines(saved.getId(), req.getAirlines());
        return saved;
    }

    @Transactional
    public void delete(Long id) {
        findById(id);
        repository.deleteById(id);
    }

    public List<UmrahPackageAirline> findAirlinesByPackageId(Long packageId) {
        return airlineRepository.findByUmrahPackageId(packageId);
    }

    private void applyFields(UmrahPackage pkg, UmrahPackageRequest req) {
        pkg.setTitle(req.getTitle());
        pkg.setDurationDays(req.getDurationDays());
        pkg.setStartDate(req.getStartDate());
        pkg.setEndDate(req.getEndDate());
        pkg.setBasePrice(req.getBasePrice());
        pkg.setPriceChild(req.getPriceChild());
        pkg.setPriceInfant(req.getPriceInfant());
        pkg.setStatus(req.getStatus() != null ? req.getStatus() : "draft");
        pkg.setConfig(req.getConfig());
        pkg.setExtras(req.getExtras());
    }

    private void saveAirlines(Long packageId, List<UmrahPackageAirlineRequest> airlines) {
        if (airlines == null || airlines.isEmpty()) return;
        List<UmrahPackageAirline> toSave = new ArrayList<>();
        for (UmrahPackageAirlineRequest ar : airlines) {
            if (ar.airlineId() == null) continue;
            Airline airline = airlineMasterRepository.findById(ar.airlineId())
                    .orElseThrow(() -> new EntityNotFoundException("Airline not found: " + ar.airlineId()));
            UmrahPackageAirline upa = new UmrahPackageAirline();
            upa.setUmrahPackageId(packageId);
            upa.setAirline(airline);
            upa.setAllocatedSeats(ar.allocatedSeats());
            toSave.add(upa);
        }
        airlineRepository.saveAll(toSave);
    }
}
