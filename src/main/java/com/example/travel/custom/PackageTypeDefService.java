package com.example.travel.custom;

import com.example.travel.tenancy.AgencyContext;
import jakarta.persistence.EntityNotFoundException;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PackageTypeDefService {

    private final PackageTypeDefRepository repository;
    private final AgencyPackageGrantRepository grantRepository;

    public PackageTypeDefService(PackageTypeDefRepository repository,
                                 AgencyPackageGrantRepository grantRepository) {
        this.repository = repository;
        this.grantRepository = grantRepository;
    }

    /** Super-admin: all type defs. Agency users: only types granted to their agency. */
    public List<PackageTypeDef> findAccessible() {
        if (AgencyContext.isSuperAdmin()) {
            return repository.findAll();
        }
        Long agencyId = AgencyContext.getCurrentAgencyId();
        return repository.findGrantedToAgency(agencyId);
    }

    public PackageTypeDef findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Package type not found: " + id));
    }

    @Transactional
    public PackageTypeDef create(PackageTypeDefRequest req) {
        PackageTypeDef def = new PackageTypeDef();
        apply(def, req);
        PackageTypeDef saved = repository.save(def);
        updateGrants(saved.getId(), req.grantedAgencyIds());
        return saved;
    }

    @Transactional
    public PackageTypeDef update(Long id, PackageTypeDefRequest req) {
        PackageTypeDef def = findById(id);
        apply(def, req);
        PackageTypeDef saved = repository.save(def);
        if (req.grantedAgencyIds() != null) {
            updateGrants(saved.getId(), req.grantedAgencyIds());
        }
        return saved;
    }

    @Transactional
    public void delete(Long id) {
        PackageTypeDef def = findById(id);
        grantRepository.deleteByTypeDefId(id);
        repository.delete(def);
    }

    @Transactional
    public void updateGrants(Long typeDefId, List<Long> agencyIds) {
        grantRepository.deleteByTypeDefId(typeDefId);
        if (agencyIds != null) {
            for (Long agencyId : agencyIds) {
                grantRepository.save(new AgencyPackageGrant(agencyId, typeDefId));
            }
        }
    }

    public List<Long> getGrantedAgencyIds(Long typeDefId) {
        return grantRepository.findAgencyIdsByTypeDefId(typeDefId);
    }

    private void apply(PackageTypeDef def, PackageTypeDefRequest req) {
        def.setName(req.name());
        def.setSlug(slugify(req.name()));
        def.setDescription(req.description());
        def.setIcon(req.icon() != null ? req.icon() : "📦");
        def.setActive(req.active() != null ? req.active() : true);
    }

    private String slugify(String name) {
        return name.toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-|-$", "");
    }
}
