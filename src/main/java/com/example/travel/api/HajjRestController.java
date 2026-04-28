package com.example.travel.api;

import com.example.travel.api.dto.HajjPackageDto;
import com.example.travel.api.mapper.PackageMapper;
import com.example.travel.hajj.HajjPackageRequest;
import com.example.travel.hajj.HajjPackageService;
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
@RequestMapping("/api/hajj-packages")
public class HajjRestController {

    private final HajjPackageService hajjPackageService;
    private final PackageMapper packageMapper;

    public HajjRestController(HajjPackageService hajjPackageService, PackageMapper packageMapper) {
        this.hajjPackageService = hajjPackageService;
        this.packageMapper = packageMapper;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('hajj:view')")
    public List<HajjPackageDto> list() {
        return hajjPackageService.findAll().stream()
                .map(packageMapper::toDto)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('hajj:view')")
    public HajjPackageDto getById(@PathVariable Long id) {
        return packageMapper.toDto(hajjPackageService.findById(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('hajj:manage')")
    public HajjPackageDto create(@RequestBody HajjPackageRequest request) {
        return packageMapper.toDto(hajjPackageService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('hajj:manage')")
    public HajjPackageDto update(@PathVariable Long id, @RequestBody HajjPackageRequest request) {
        return packageMapper.toDto(hajjPackageService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('hajj:manage')")
    public void delete(@PathVariable Long id) {
        hajjPackageService.delete(id);
    }

    @GetMapping("/{id}/shares")
    @PreAuthorize("hasAuthority('hajj:manage')")
    public List<Long> getShares(@PathVariable Long id) {
        return hajjPackageService.getShares(id);
    }

    @PutMapping("/{id}/shares")
    @PreAuthorize("hasRole('super_admin')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void updateShares(@PathVariable Long id, @RequestBody List<Long> agencyIds) {
        hajjPackageService.updateShares(id, agencyIds);
    }
}
