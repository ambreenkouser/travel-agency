package com.example.travel.api;

import com.example.travel.auth.AuthUserDetails;
import com.example.travel.auth.User;
import com.example.travel.auth.UserRepository;
import com.example.travel.offer.Offer;
import com.example.travel.offer.OfferRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/offers")
public class OfferRestController {

    private final OfferRepository offerRepository;
    private final UserRepository userRepository;

    public OfferRestController(OfferRepository offerRepository, UserRepository userRepository) {
        this.offerRepository = offerRepository;
        this.userRepository = userRepository;
    }

    /** Offers sent BY the current parent user (their created offers). */
    @GetMapping("/sent")
    @PreAuthorize("hasAuthority('bookings:confirm')")
    public List<OfferDto> sent(@AuthenticationPrincipal AuthUserDetails principal) {
        return offerRepository
                .findByCreatedByUserIdOrderByCreatedAtDesc(principal.getUserId())
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    /** Active offers addressed TO the current user (agent sees their own offers). */
    @GetMapping("/my")
    @PreAuthorize("isAuthenticated()")
    public List<OfferDto> my(@AuthenticationPrincipal AuthUserDetails principal) {
        return offerRepository
                .findByTargetUserIdAndActiveTrueOrderByCreatedAtDesc(principal.getUserId())
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    /** All offers (active + inactive) for a specific child — parent viewing. */
    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAuthority('bookings:confirm')")
    public List<OfferDto> forUser(@PathVariable Long userId,
                                   @AuthenticationPrincipal AuthUserDetails principal) {
        List<Long> childIds = userRepository.findByParentId(principal.getUserId())
                .stream().map(User::getId).collect(Collectors.toList());
        if (!childIds.contains(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You can only view offers for your direct sub-agents.");
        }
        return offerRepository.findByTargetUserIdOrderByCreatedAtDesc(userId)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    /** Parent creates a new offer for a direct child agent. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('bookings:confirm')")
    public OfferDto create(@RequestBody CreateOfferRequest req,
                            @AuthenticationPrincipal AuthUserDetails principal) {
        if (req.targetUserId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Target agent is required.");
        }
        // Validate direct child
        List<Long> childIds = userRepository.findByParentId(principal.getUserId())
                .stream().map(User::getId).collect(Collectors.toList());
        if (!childIds.contains(req.targetUserId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You can only create offers for your direct sub-agents.");
        }

        Offer offer = new Offer();
        offer.setAgencyId(principal.getAgencyId());
        offer.setCreatedByUserId(principal.getUserId());
        offer.setTargetUserId(req.targetUserId());
        offer.setTitle(req.title());
        offer.setDescription(req.description());
        offer.setDiscountType(req.discountType() != null ? req.discountType() : "FIXED");
        offer.setDiscountValue(req.discountValue());
        offer.setValidFrom(req.validFrom());
        offer.setValidUntil(req.validUntil());
        offer.setActive(true);

        return toDto(offerRepository.save(offer));
    }

    /** Parent deactivates an offer they created. */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('bookings:confirm')")
    public void deactivate(@PathVariable Long id,
                            @AuthenticationPrincipal AuthUserDetails principal) {
        Offer offer = offerRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Offer not found."));
        if (!principal.getUserId().equals(offer.getCreatedByUserId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your offer.");
        }
        offer.setActive(false);
        offerRepository.save(offer);
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private OfferDto toDto(Offer o) {
        String targetName = userRepository.findById(o.getTargetUserId())
                .map(u -> u.getFirstName() + " " + u.getLastName()).orElse(null);
        return new OfferDto(
                o.getId(), o.getTitle(), o.getDescription(),
                o.getDiscountType(), o.getDiscountValue(),
                o.getValidFrom(), o.getValidUntil(),
                o.isActive(), o.getTargetUserId(), targetName,
                o.getCreatedAt()
        );
    }

    public record CreateOfferRequest(
            Long targetUserId,
            String title,
            String description,
            String discountType,
            BigDecimal discountValue,
            LocalDate validFrom,
            LocalDate validUntil
    ) {}

    public record OfferDto(
            Long id,
            String title,
            String description,
            String discountType,
            BigDecimal discountValue,
            LocalDate validFrom,
            LocalDate validUntil,
            boolean active,
            Long targetUserId,
            String targetName,
            java.time.Instant createdAt
    ) {}
}
