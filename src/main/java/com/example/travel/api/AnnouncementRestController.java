package com.example.travel.api;

import com.example.travel.announcement.Announcement;
import com.example.travel.announcement.AnnouncementRepository;
import com.example.travel.auth.AuthUserDetails;
import com.example.travel.auth.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import java.io.IOException;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/announcements")
public class AnnouncementRestController {

    private final AnnouncementRepository repository;
    private final UserRepository userRepository;

    public AnnouncementRestController(AnnouncementRepository repository,
                                       UserRepository userRepository) {
        this.repository = repository;
        this.userRepository = userRepository;
    }

    /**
     * Announcements targeted at the current user based on their role:
     * - agency_admin → sees 'AGENCY_ADMINS' announcements (from super_admin)
     * - sub_agent / other → sees 'CHILDREN' announcements where creator = their parent
     */
    @GetMapping("/my")
    public List<AnnouncementDto> my(@AuthenticationPrincipal AuthUserDetails principal) {
        int level = principal.getUserTypeLevel();
        LocalDate today = LocalDate.now();
        List<Announcement> raw = new ArrayList<>();

        // Always read parentId fresh from DB via native SQL —
        // bypasses the Hibernate agencyFilter so it always returns the correct value.
        Long parentId = userRepository.findParentId(principal.getUserId());

        if (level == 2) {
            // master_agent sees AGENCY_ADMINS announcements (broadcast by super_admin)
            raw.addAll(repository.findByTargetType("AGENCY_ADMINS"));
        } else if (level == 3) {
            // agency_admin sees:
            // 1. AGENCY_ADMINS announcements (broadcast by super_admin)
            // 2. CHILDREN announcements created by their direct parent
            raw.addAll(repository.findByTargetType("AGENCY_ADMINS"));
            if (parentId != null) {
                raw.addAll(repository.findByTargetTypeAndCreator("CHILDREN", parentId));
            }
        } else if (level >= 4) {
            // sub_agent sees CHILDREN announcements created by their direct parent
            if (parentId != null) {
                raw.addAll(repository.findByTargetTypeAndCreator("CHILDREN", parentId));
            }
        }
        // level 1 (super_admin) is sender only — raw stays empty

        return raw.stream()
                .filter(a -> a.getValidFrom()  == null || !a.getValidFrom().isAfter(today))
                .filter(a -> a.getValidUntil() == null || !a.getValidUntil().isBefore(today))
                .map(a -> toDto(a))
                .collect(Collectors.toList());
    }

    /** Announcements created by the current user (management view). */
    @GetMapping("/sent")
    public List<AnnouncementDto> sent(@AuthenticationPrincipal AuthUserDetails principal) {
        return repository.findSentByUser(principal.getUserId())
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    /** Create a new announcement (multipart — title + image + mandatory dates). */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public AnnouncementDto create(
            @RequestParam String title,
            @RequestParam(required = false) String message,
            @RequestParam String validFrom,
            @RequestParam String validUntil,
            @RequestParam(required = false) MultipartFile image,
            @AuthenticationPrincipal AuthUserDetails principal) throws IOException {

        int level = principal.getUserTypeLevel();
        if (level >= 4) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You do not have permission to create announcements.");
        }
        if (validFrom.isBlank() || validUntil.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Start date and end date are required.");
        }
        LocalDate from  = LocalDate.parse(validFrom);
        LocalDate until = LocalDate.parse(validUntil);
        if (until.isBefore(from)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "End date must be on or after start date.");
        }

        String targetType = (level == 1) ? "AGENCY_ADMINS" : "CHILDREN";

        Announcement ann = new Announcement();
        ann.setCreatedByUserId(principal.getUserId());
        ann.setAgencyId(principal.getAgencyId());
        ann.setTargetType(targetType);
        ann.setTitle(title.trim());
        ann.setMessage(message != null ? message.trim() : null);
        ann.setValidFrom(from);
        ann.setValidUntil(until);
        ann.setActive(true);

        if (image != null && !image.isEmpty()) {
            ann.setImageData(image.getBytes());
            ann.setImageContentType(image.getContentType());
        }

        Announcement saved = repository.save(ann);
        return toDto(saved);
    }

    /** Soft-delete an announcement (creator only). */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id,
                       @AuthenticationPrincipal AuthUserDetails principal) {
        Announcement ann = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Announcement not found: " + id));

        boolean isSuperAdmin = principal.getUserTypeLevel() == 1;
        if (!isSuperAdmin && !ann.getCreatedByUserId().equals(principal.getUserId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your announcement.");
        }

        ann.setActive(false);
        repository.save(ann);
    }

    /** Serve the announcement image stored in the database. */
    @GetMapping("/{id}/image")
    public ResponseEntity<byte[]> image(@PathVariable Long id) {
        Announcement ann = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Announcement not found: " + id));
        if (ann.getImageData() == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No image for this announcement.");
        }
        MediaType mediaType = ann.getImageContentType() != null
                ? MediaType.parseMediaType(ann.getImageContentType())
                : MediaType.IMAGE_JPEG;
        return ResponseEntity.ok().contentType(mediaType).body(ann.getImageData());
    }

    // ── DTO ──────────────────────────────────────────────────────────────────

    private AnnouncementDto toDto(Announcement a) {
        String createdByName = userRepository.findById(a.getCreatedByUserId())
                .map(u -> u.getFirstName() + " " + u.getLastName())
                .orElse(null);
        return new AnnouncementDto(
                a.getId(), a.getTitle(), a.getMessage(), a.getTargetType(),
                a.getImageData() != null && a.getImageData().length > 0,
                a.getValidFrom(), a.getValidUntil(),
                a.getCreatedAt(), createdByName);
    }

    public record AnnouncementDto(
            Long id,
            String title,
            String message,
            String targetType,
            boolean hasImage,
            LocalDate validFrom,
            LocalDate validUntil,
            Instant createdAt,
            String createdByName
    ) {}
}
