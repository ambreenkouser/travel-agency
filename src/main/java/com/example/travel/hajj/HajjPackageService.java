package com.example.travel.hajj;

import com.example.travel.share.ContentShare;
import com.example.travel.share.ContentShareRepository;
import com.example.travel.tenancy.AgencyContext;
import jakarta.persistence.EntityNotFoundException;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class HajjPackageService {

    private final HajjPackageRepository repository;
    private final ContentShareRepository shareRepository;

    public HajjPackageService(HajjPackageRepository repository,
                              ContentShareRepository shareRepository) {
        this.repository = repository;
        this.shareRepository = shareRepository;
    }

    public List<HajjPackage> findAll() {
        Long agencyId = AgencyContext.getCurrentAgencyId();
        return AgencyContext.isSuperAdmin()
                ? repository.findByAgencyId(agencyId)
                : repository.findVisibleToAgency(agencyId);
    }

    public HajjPackage findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Hajj package not found: " + id));
    }

    @Transactional
    public HajjPackage create(HajjPackageRequest req) {
        Long agencyId = AgencyContext.getCurrentAgencyId();
        if (agencyId == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Current user has no agency assigned.");
        HajjPackage pkg = new HajjPackage();
        pkg.setAgencyId(agencyId);
        apply(pkg, req);
        HajjPackage saved = repository.save(pkg);
        updateShares(saved.getId(), req.sharedWith());
        return saved;
    }

    @Transactional
    public HajjPackage update(Long id, HajjPackageRequest req) {
        HajjPackage pkg = findById(id);
        apply(pkg, req);
        HajjPackage saved = repository.save(pkg);
        if (req.sharedWith() != null) {
            updateShares(saved.getId(), req.sharedWith());
        }
        return saved;
    }

    @Transactional
    public void delete(Long id) {
        HajjPackage pkg = findById(id);
        repository.delete(pkg);
    }

    @Transactional
    public void updateShares(Long packageId, List<Long> agencyIds) {
        shareRepository.deleteByContentTypeAndContentId("hajj", packageId);
        if (agencyIds != null) {
            for (Long agencyId : agencyIds) {
                ContentShare share = new ContentShare();
                share.setContentType("hajj");
                share.setContentId(packageId);
                share.setTargetAgencyId(agencyId);
                shareRepository.save(share);
            }
        }
    }

    public List<Long> getShares(Long packageId) {
        return shareRepository.findTargetAgencyIdsByContentTypeAndContentId("hajj", packageId);
    }

    private void apply(HajjPackage pkg, HajjPackageRequest req) {
        pkg.setTitle(req.title());
        pkg.setQuotaTotal(req.quotaTotal());
        pkg.setQuotaReserved(req.quotaReserved());
        pkg.setBasePrice(req.basePrice());
        pkg.setPriceChild(req.priceChild());
        pkg.setPriceInfant(req.priceInfant());
        pkg.setCompliance(req.compliance());
        pkg.setExtras(req.extras());
        pkg.setContactPersonPhone(req.contactPersonPhone());
        pkg.setContactPersonEmail(req.contactPersonEmail());
        pkg.setPackageClass(req.packageClass() != null ? req.packageClass() : "economy");
        pkg.setCostAdult(req.costAdult());
        pkg.setCostChild(req.costChild());
        pkg.setCostInfant(req.costInfant());
    }
}
