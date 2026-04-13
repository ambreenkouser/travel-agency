package com.example.travel.hajj;

import com.example.travel.tenancy.AgencyContext;
import jakarta.persistence.EntityNotFoundException;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class HajjPackageService {

    private final HajjPackageRepository repository;

    public HajjPackageService(HajjPackageRepository repository) {
        this.repository = repository;
    }

    public List<HajjPackage> findAll() {
        return repository.findAll();
    }

    public HajjPackage findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Hajj package not found: " + id));
    }

    public HajjPackage create(HajjPackageRequest req) {
        HajjPackage pkg = new HajjPackage();
        pkg.setAgencyId(AgencyContext.getCurrentAgencyId());
        apply(pkg, req);
        return repository.save(pkg);
    }

    public HajjPackage update(Long id, HajjPackageRequest req) {
        HajjPackage pkg = findById(id);
        apply(pkg, req);
        return repository.save(pkg);
    }

    public void delete(Long id) {
        HajjPackage pkg = findById(id);
        repository.delete(pkg); // triggers @SQLDelete soft-delete
    }

    private void apply(HajjPackage pkg, HajjPackageRequest req) {
        pkg.setTitle(req.title());
        pkg.setQuotaTotal(req.quotaTotal());
        pkg.setQuotaReserved(req.quotaReserved());
        pkg.setBasePrice(req.basePrice());
        pkg.setCompliance(req.compliance());
    }
}
