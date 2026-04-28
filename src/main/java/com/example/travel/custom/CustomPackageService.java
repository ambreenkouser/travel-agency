package com.example.travel.custom;

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
public class CustomPackageService {

    private final CustomPackageRepository repository;
    private final ContentShareRepository shareRepository;
    private final CustomPackageUserGrantRepository userGrantRepository;

    public CustomPackageService(CustomPackageRepository repository,
                                ContentShareRepository shareRepository,
                                CustomPackageUserGrantRepository userGrantRepository) {
        this.repository = repository;
        this.shareRepository = shareRepository;
        this.userGrantRepository = userGrantRepository;
    }

    /** List all packages (used by admin/agency-admin views, not sub-agent). */
    public List<CustomPackage> findAll() {
        Long agencyId = AgencyContext.getCurrentAgencyId();
        return AgencyContext.isSuperAdmin()
                ? repository.findByAgencyId(agencyId)
                : repository.findVisibleToAgency(agencyId);
    }

    /** Packages of a specific type def — for agency admin management page. */
    public List<CustomPackage> findByTypeDef(Long typeDefId) {
        Long agencyId = AgencyContext.getCurrentAgencyId();
        return repository.findByAgencyIdAndTypeDefId(agencyId, typeDefId);
    }

    /** Packages visible to a specific sub-agent user. */
    public List<CustomPackage> findVisibleToUser(Long userId) {
        Long agencyId = AgencyContext.getCurrentAgencyId();
        return repository.findVisibleToUser(agencyId, userId);
    }

    public CustomPackage findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Custom package not found: " + id));
    }

    @Transactional
    public CustomPackage create(CustomPackageRequest req) {
        Long agencyId = AgencyContext.getCurrentAgencyId();
        if (agencyId == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Current user has no agency assigned.");
        CustomPackage pkg = new CustomPackage();
        pkg.setAgencyId(agencyId);
        apply(pkg, req);
        CustomPackage saved = repository.save(pkg);
        updateUserGrants(saved.getId(), req.assignedUserIds());
        return saved;
    }

    @Transactional
    public CustomPackage update(Long id, CustomPackageRequest req) {
        CustomPackage pkg = findById(id);
        apply(pkg, req);
        CustomPackage saved = repository.save(pkg);
        if (req.assignedUserIds() != null) {
            updateUserGrants(saved.getId(), req.assignedUserIds());
        }
        return saved;
    }

    @Transactional
    public void delete(Long id) {
        CustomPackage pkg = findById(id);
        userGrantRepository.deleteByPackageId(id);
        repository.delete(pkg);
    }

    // ── Content shares (agency-level sharing, kept for backward compat) ──────

    @Transactional
    public void updateShares(Long packageId, List<Long> agencyIds) {
        shareRepository.deleteByContentTypeAndContentId("custom", packageId);
        if (agencyIds != null) {
            for (Long agencyId : agencyIds) {
                ContentShare share = new ContentShare();
                share.setContentType("custom");
                share.setContentId(packageId);
                share.setTargetAgencyId(agencyId);
                shareRepository.save(share);
            }
        }
    }

    public List<Long> getShares(Long packageId) {
        return shareRepository.findTargetAgencyIdsByContentTypeAndContentId("custom", packageId);
    }

    // ── User grants (sub-agent level visibility) ─────────────────────────────

    @Transactional
    public void updateUserGrants(Long packageId, List<Long> userIds) {
        userGrantRepository.deleteByPackageId(packageId);
        if (userIds != null && !userIds.isEmpty()) {
            for (Long userId : userIds) {
                userGrantRepository.save(new CustomPackageUserGrant(packageId, userId));
            }
        }
    }

    public List<Long> getUserGrants(Long packageId) {
        return userGrantRepository.findUserIdsByPackageId(packageId);
    }

    private void apply(CustomPackage pkg, CustomPackageRequest req) {
        if (req.typeDefId() != null)  pkg.setTypeDefId(req.typeDefId());
        if (req.packageType() != null) pkg.setPackageType(req.packageType());
        pkg.setTitle(req.title());
        pkg.setDescription(req.description());
        pkg.setBasePrice(req.basePrice());
        pkg.setPriceChild(req.priceChild());
        pkg.setPriceInfant(req.priceInfant());
        pkg.setQuotaTotal(req.quotaTotal());
        pkg.setQuotaReserved(req.quotaReserved() != null ? req.quotaReserved() : 0);
        pkg.setAttributes(req.attributes());
        pkg.setExtras(req.extras());
        pkg.setStatus(req.status() != null ? req.status() : "draft");
        pkg.setContactPersonPhone(req.contactPersonPhone());
        pkg.setContactPersonEmail(req.contactPersonEmail());
        pkg.setPackageClass(req.packageClass() != null ? req.packageClass() : "economy");
        pkg.setCostAdult(req.costAdult());
        pkg.setCostChild(req.costChild());
        pkg.setCostInfant(req.costInfant());
        boolean hasSpecificUsers = req.assignedUserIds() != null && !req.assignedUserIds().isEmpty();
        pkg.setVisibleToAll(!hasSpecificUsers);
    }
}
