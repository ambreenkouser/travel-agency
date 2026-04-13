package com.example.travel.api;

import com.example.travel.api.dto.LedgerEntryDto;
import com.example.travel.auth.AuthUserDetails;
import com.example.travel.auth.User;
import com.example.travel.auth.UserRepository;
import com.example.travel.booking.LedgerEntry;
import com.example.travel.booking.LedgerService;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/ledger")
public class LedgerRestController {

    private final LedgerService ledgerService;
    private final UserRepository userRepository;

    public LedgerRestController(LedgerService ledgerService, UserRepository userRepository) {
        this.ledgerService = ledgerService;
        this.userRepository = userRepository;
    }

    /**
     * Current user's own ledger entries.
     * Every authenticated user can see their own — no cross-user data leakage.
     */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public List<LedgerEntryDto> list(@AuthenticationPrincipal AuthUserDetails principal) {
        return enrich(ledgerService.findByUser(principal.getUserId()));
    }

    /**
     * Ledger entries for a specific child user — parent viewing agent's account.
     * Caller must have bookings:confirm and the target must be a direct child.
     */
    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAuthority('bookings:confirm')")
    public List<LedgerEntryDto> userLedger(@PathVariable Long userId,
                                            @AuthenticationPrincipal AuthUserDetails principal) {
        // Validate that the requested user is a direct child of the caller
        List<Long> childIds = userRepository.findByParentId(principal.getUserId())
                .stream().map(User::getId).collect(Collectors.toList());
        if (!childIds.contains(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You can only view ledger of your direct sub-agents.");
        }
        return enrich(ledgerService.findByUser(userId));
    }

    /**
     * Current user's own ledger entries — accessible to agents.
     */
    @GetMapping("/my")
    @PreAuthorize("hasAuthority('bookings:view')")
    public List<LedgerEntryDto> myLedger(@AuthenticationPrincipal AuthUserDetails principal) {
        return enrich(ledgerService.findByUser(principal.getUserId()));
    }

    /**
     * Parent creates a credit adjustment for a direct child user.
     */
    @PostMapping("/adjustment")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('bookings:confirm')")
    public void createAdjustment(@RequestBody AdjustmentRequest req,
                                  @AuthenticationPrincipal AuthUserDetails principal) {
        if (req.amount() == null || req.amount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Amount must be positive.");
        }

        // Validate child is a direct sub-agent of the caller
        List<Long> childIds = userRepository.findByParentId(principal.getUserId())
                .stream().map(User::getId).collect(Collectors.toList());
        if (!childIds.contains(req.childUserId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You can only adjust accounts of your direct sub-agents.");
        }

        User child = userRepository.findById(req.childUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));
        String childName = child.getFirstName() + " " + child.getLastName();

        ledgerService.createAdjustment(
                principal.getUserId(),
                req.childUserId(),
                principal.getAgencyId(),
                req.amount(),
                req.currency() != null ? req.currency() : "PKR",
                childName,
                req.memo()
        );
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private List<LedgerEntryDto> enrich(List<LedgerEntry> entries) {
        // Batch-load user names
        Map<Long, String> userNames = new HashMap<>();
        entries.stream()
                .map(LedgerEntry::getUserId)
                .filter(id -> id != null && !userNames.containsKey(id))
                .distinct()
                .forEach(id -> userRepository.findById(id)
                        .ifPresent(u -> userNames.put(id, u.getFirstName() + " " + u.getLastName())));

        return entries.stream()
                .map(e -> new LedgerEntryDto(
                        e.getId(),
                        e.getUserId(),
                        userNames.get(e.getUserId()),
                        e.getBookingId(),
                        e.getEntryType().name(),
                        e.getAmount(),
                        e.getCurrency(),
                        e.getMemo(),
                        e.getCreatedAt()
                ))
                .collect(Collectors.toList());
    }

    public record AdjustmentRequest(Long childUserId, BigDecimal amount, String currency, String memo) {}
}
