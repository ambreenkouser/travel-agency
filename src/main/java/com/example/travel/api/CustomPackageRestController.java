package com.example.travel.api;

import com.example.travel.api.dto.CustomPackageDto;
import com.example.travel.auth.AuthUserDetails;
import com.example.travel.custom.CustomPackage;
import com.example.travel.custom.CustomPackageRequest;
import com.example.travel.custom.CustomPackageService;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/custom-packages")
public class CustomPackageRestController {

    private final CustomPackageService service;

    public CustomPackageRestController(CustomPackageService service) {
        this.service = service;
    }

    /**
     * Admin/agency-admin: all packages for their agency.
     * Sub-agents call /my instead.
     */
    @GetMapping
    @PreAuthorize("hasAuthority('custom:manage')")
    public List<CustomPackageDto> list() {
        return service.findAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    /**
     * Agency-admin: packages of a specific type def (management page).
     */
    @GetMapping("/by-type/{typeDefId}")
    @PreAuthorize("hasAuthority('custom:manage')")
    public List<CustomPackageDto> listByType(@PathVariable Long typeDefId) {
        return service.findByTypeDef(typeDefId).stream().map(this::toDto).collect(Collectors.toList());
    }

    /**
     * Sub-agent: packages visible to them (active + assigned).
     */
    @GetMapping("/my")
    @PreAuthorize("hasAuthority('custom:view')")
    public List<CustomPackageDto> myPackages(@AuthenticationPrincipal AuthUserDetails principal) {
        return service.findVisibleToUser(principal.getUserId())
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('custom:view')")
    public CustomPackageDto getById(@PathVariable Long id) {
        return toDto(service.findById(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('custom:manage')")
    public CustomPackageDto create(@RequestBody CustomPackageRequest request) {
        return toDto(service.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('custom:manage')")
    public CustomPackageDto update(@PathVariable Long id, @RequestBody CustomPackageRequest request) {
        return toDto(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('custom:manage')")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }

    /** Get sub-agent user IDs assigned to a package. */
    @GetMapping("/{id}/user-grants")
    @PreAuthorize("hasAuthority('custom:manage')")
    public List<Long> getUserGrants(@PathVariable Long id) {
        return service.getUserGrants(id);
    }

    /** Agency-admin assigns package to specific sub-agents. */
    @PutMapping("/{id}/user-grants")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('custom:manage')")
    public void updateUserGrants(@PathVariable Long id, @RequestBody List<Long> userIds) {
        CustomPackage pkg = service.findById(id);
        pkg.setVisibleToAll(userIds == null || userIds.isEmpty());
        service.updateUserGrants(id, userIds);
    }

    /** Legacy agency-level shares (kept for backward compat). */
    @GetMapping("/{id}/shares")
    @PreAuthorize("hasAuthority('custom:manage')")
    public List<Long> getShares(@PathVariable Long id) {
        return service.getShares(id);
    }

    @PutMapping("/{id}/shares")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('super_admin')")
    public void updateShares(@PathVariable Long id, @RequestBody List<Long> agencyIds) {
        service.updateShares(id, agencyIds);
    }

    private CustomPackageDto toDto(CustomPackage p) {
        return new CustomPackageDto(
                p.getId(),
                p.getAgencyId(),
                p.getTypeDefId(),
                p.getPackageType(),
                p.getTitle(),
                p.getDescription(),
                p.getBasePrice(),
                p.getPriceChild(),
                p.getPriceInfant(),
                p.getQuotaTotal(),
                p.getQuotaReserved(),
                p.getAttributes(),
                p.getExtras(),
                p.getStatus(),
                p.getContactPersonPhone(),
                p.getContactPersonEmail(),
                p.getPackageClass(),
                p.getCostAdult(),
                p.getCostChild(),
                p.getCostInfant(),
                p.isVisibleToAll(),
                service.getUserGrants(p.getId())
        );
    }
}
