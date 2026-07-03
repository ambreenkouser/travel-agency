package com.example.travel.agency;

import com.example.travel.auth.AuthUserDetails;
import java.io.IOException;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
@RequestMapping("/api/agencies")
public class AgencyController {

    private final AgencyService service;

    public AgencyController(AgencyService service) {
        this.service = service;
    }

    /** super_admin sees every agency; everyone else sees their own tenant plus agencies they created. */
    @GetMapping
    @PreAuthorize("hasAuthority('agencies:view')")
    public List<Agency> list(@AuthenticationPrincipal AuthUserDetails principal) {
        if (principal.getUserTypeLevel() == 1) {
            return service.findAll();
        }
        return service.findVisibleTo(principal.getAgencyId(), principal.getUserId());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('agencies:view')")
    public Agency get(@PathVariable Long id, @AuthenticationPrincipal AuthUserDetails principal) {
        Agency agency = service.findById(id);
        assertCanManage(agency, principal);
        return agency;
    }

    @PostMapping
    @PreAuthorize("hasAuthority('agencies:create')")
    public ResponseEntity<Agency> create(@RequestBody AgencyRequest req,
                                         @AuthenticationPrincipal AuthUserDetails principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(req, principal.getUserId()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('agencies:edit')")
    public Agency update(@PathVariable Long id, @RequestBody AgencyRequest req,
                         @AuthenticationPrincipal AuthUserDetails principal) {
        assertCanManage(service.findById(id), principal);
        return service.update(id, req);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('agencies:delete')")
    public ResponseEntity<Void> delete(@PathVariable Long id, @AuthenticationPrincipal AuthUserDetails principal) {
        assertCanManage(service.findById(id), principal);
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    /** Upload a logo image for an agency — stored as binary in the database. */
    @PostMapping(value = "/{id}/logo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('agencies:edit')")
    public void uploadLogo(@PathVariable Long id, @RequestParam MultipartFile logo,
                           @AuthenticationPrincipal AuthUserDetails principal) throws IOException {
        assertCanManage(service.findById(id), principal);
        service.saveLogo(id, logo.getBytes(), logo.getContentType());
    }

    /** Allowed if super_admin, this is the caller's own tenant, or the caller created it themselves. */
    private void assertCanManage(Agency agency, AuthUserDetails principal) {
        if (principal.getUserTypeLevel() == 1) return;
        boolean isOwnTenant = agency.getId().equals(principal.getAgencyId());
        boolean isCreator = principal.getUserId().equals(agency.getCreatedByUserId());
        if (!isOwnTenant && !isCreator) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You can only manage your own agency or agencies you created.");
        }
    }

    /** Serve the agency logo stored in the database. */
    @GetMapping("/{id}/logo")
    public ResponseEntity<byte[]> getLogo(@PathVariable Long id) {
        Agency agency = service.findById(id);
        if (agency.getLogoData() == null) {
            return ResponseEntity.notFound().build();
        }
        MediaType mediaType = agency.getLogoContentType() != null
                ? MediaType.parseMediaType(agency.getLogoContentType())
                : MediaType.IMAGE_JPEG;
        return ResponseEntity.ok().contentType(mediaType).body(agency.getLogoData());
    }
}
