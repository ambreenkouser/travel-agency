package com.example.travel.api;

import com.example.travel.api.dto.PackageTypeDefDto;
import com.example.travel.custom.PackageTypeDef;
import com.example.travel.custom.PackageTypeDefRequest;
import com.example.travel.custom.PackageTypeDefService;
import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

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

    @PostMapping("/{id}/image")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('custom:manage')")
    public void uploadImage(@PathVariable Long id, @RequestParam MultipartFile image) throws IOException {
        PackageTypeDef def = service.findById(id);
        def.setImageData(image.getBytes());
        def.setImageContentType(image.getContentType());
        service.save(def);
    }

    @GetMapping("/{id}/image")
    public ResponseEntity<byte[]> getImage(@PathVariable Long id) {
        PackageTypeDef def = service.findById(id);
        if (def.getImageData() == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No image");
        MediaType mt = def.getImageContentType() != null ? MediaType.parseMediaType(def.getImageContentType()) : MediaType.IMAGE_JPEG;
        return ResponseEntity.ok().contentType(mt).body(def.getImageData());
    }

    private PackageTypeDefDto toDto(PackageTypeDef def) {
        return new PackageTypeDefDto(
                def.getId(),
                def.getName(),
                def.getSlug(),
                def.getDescription(),
                def.getIcon(),
                def.isActive(),
                service.getGrantedAgencyIds(def.getId()),
                def.getImageData() != null
        );
    }
}
