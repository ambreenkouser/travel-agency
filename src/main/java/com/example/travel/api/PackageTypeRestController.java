package com.example.travel.api;

import com.example.travel.api.dto.PackageTypeDefDto;
import com.example.travel.custom.PackageTypeDef;
import com.example.travel.custom.PackageTypeDefRequest;
import com.example.travel.custom.PackageTypeDefService;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
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
@RequestMapping("/api/package-type-defs")
public class PackageTypeRestController {

    private final PackageTypeDefService service;

    public PackageTypeRestController(PackageTypeDefService service) {
        this.service = service;
    }

    /**
     * Super-admin: all types. Agency users: only types granted to their agency.
     * Used by sidebar to build dynamic nav items.
     */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public List<PackageTypeDefDto> list() {
        return service.findAccessible().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public PackageTypeDefDto getById(@PathVariable Long id) {
        return toDto(service.findById(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('custom:manage')")
    public PackageTypeDefDto create(@RequestBody PackageTypeDefRequest request) {
        return toDto(service.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('custom:manage')")
    public PackageTypeDefDto update(@PathVariable Long id, @RequestBody PackageTypeDefRequest request) {
        return toDto(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('custom:manage')")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }

    private PackageTypeDefDto toDto(PackageTypeDef def) {
        return new PackageTypeDefDto(
                def.getId(),
                def.getName(),
                def.getSlug(),
                def.getDescription(),
                def.getIcon(),
                def.isActive(),
                service.getGrantedAgencyIds(def.getId())
        );
    }
}
