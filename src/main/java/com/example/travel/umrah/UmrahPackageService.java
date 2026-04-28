package com.example.travel.umrah;

import com.example.travel.flight.Airline;
import com.example.travel.flight.AirlineRepository;
import com.example.travel.share.ContentShare;
import com.example.travel.share.ContentShareRepository;
import com.example.travel.tenancy.AgencyContext;
import jakarta.persistence.EntityNotFoundException;
import java.util.ArrayList;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class UmrahPackageService {

    private final UmrahPackageRepository repository;
    private final UmrahPackageAirlineRepository airlineRepository;
    private final AirlineRepository airlineMasterRepository;
    private final ContentShareRepository shareRepository;

    public UmrahPackageService(UmrahPackageRepository repository,
                               UmrahPackageAirlineRepository airlineRepository,
                               AirlineRepository airlineMasterRepository,
                               ContentShareRepository shareRepository) {
        this.repository = repository;
        this.airlineRepository = airlineRepository;
        this.airlineMasterRepository = airlineMasterRepository;
        this.shareRepository = shareRepository;
    }

    public List<UmrahPackage> findAll() {
        Long agencyId = AgencyContext.getCurrentAgencyId();
        return AgencyContext.isSuperAdmin()
                ? repository.findByAgencyId(agencyId)
                : repository.findVisibleToAgency(agencyId);
    }

    public UmrahPackage findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Umrah package not found: " + id));
    }

    @Transactional
    public UmrahPackage create(UmrahPackageRequest req) {
        Long agencyId = AgencyContext.getCurrentAgencyId();
        if (agencyId == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Current user has no agency assigned.");
        UmrahPackage pkg = new UmrahPackage();
        pkg.setAgencyId(agencyId);
        applyFields(pkg, req);
        UmrahPackage saved = repository.save(pkg);
        saveAirlines(saved.getId(), req.getAirlines());
        updateShares(saved.getId(), req.getSharedWith());
        return saved;
    }

    @Transactional
    public UmrahPackage update(Long id, UmrahPackageRequest req) {
        UmrahPackage pkg = findById(id);
        applyFields(pkg, req);
        UmrahPackage saved = repository.save(pkg);
        airlineRepository.deleteByUmrahPackageId(saved.getId());
        saveAirlines(saved.getId(), req.getAirlines());
        if (req.getSharedWith() != null) {
            updateShares(saved.getId(), req.getSharedWith());
        }
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

    @Transactional
    public void updateShares(Long packageId, List<Long> agencyIds) {
        shareRepository.deleteByContentTypeAndContentId("umrah", packageId);
        if (agencyIds != null) {
            for (Long agencyId : agencyIds) {
                ContentShare share = new ContentShare();
                share.setContentType("umrah");
                share.setContentId(packageId);
                share.setTargetAgencyId(agencyId);
                shareRepository.save(share);
            }
        }
    }

    public List<Long> getShares(Long packageId) {
        return shareRepository.findTargetAgencyIdsByContentTypeAndContentId("umrah", packageId);
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
        pkg.setContactPersonPhone(req.getContactPersonPhone());
        pkg.setContactPersonEmail(req.getContactPersonEmail());
        pkg.setPackageClass(req.getPackageClass() != null ? req.getPackageClass() : "economy");
        pkg.setCostAdult(req.getCostAdult());
        pkg.setCostChild(req.getCostChild());
        pkg.setCostInfant(req.getCostInfant());
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
