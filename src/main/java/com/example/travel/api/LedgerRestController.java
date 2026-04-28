package com.example.travel.api;

import com.example.travel.api.dto.LedgerEntryDto;
import com.example.travel.auth.AuthUserDetails;
import com.example.travel.auth.User;
import com.example.travel.auth.UserRepository;
import com.example.travel.booking.BookingRepository;
import com.example.travel.booking.LedgerEntry;
import com.example.travel.booking.LedgerService;
import com.example.travel.custom.CustomPackage;
import com.example.travel.custom.CustomPackageRepository;
import com.example.travel.flight.FlightLegRepository;
import com.example.travel.flight.FlightRepository;
import com.example.travel.hajj.HajjPackage;
import com.example.travel.hajj.HajjPackageRepository;
import com.example.travel.umrah.UmrahPackage;
import com.example.travel.umrah.UmrahPackageRepository;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
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
    private final BookingRepository bookingRepository;
    private final FlightRepository flightRepository;
    private final FlightLegRepository flightLegRepository;
    private final UmrahPackageRepository umrahPackageRepository;
    private final HajjPackageRepository hajjPackageRepository;
    private final CustomPackageRepository customPackageRepository;

    public LedgerRestController(LedgerService ledgerService,
                                UserRepository userRepository,
                                BookingRepository bookingRepository,
                                FlightRepository flightRepository,
                                FlightLegRepository flightLegRepository,
                                UmrahPackageRepository umrahPackageRepository,
                                HajjPackageRepository hajjPackageRepository,
                                CustomPackageRepository customPackageRepository) {
        this.ledgerService = ledgerService;
        this.userRepository = userRepository;
        this.bookingRepository = bookingRepository;
        this.flightRepository = flightRepository;
        this.flightLegRepository = flightLegRepository;
        this.umrahPackageRepository = umrahPackageRepository;
        this.hajjPackageRepository = hajjPackageRepository;
        this.customPackageRepository = customPackageRepository;
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
        // Batch-load bookings
        Set<Long> bookingIds = entries.stream()
                .map(LedgerEntry::getBookingId)
                .filter(id -> id != null)
                .collect(Collectors.toSet());
        Map<Long, com.example.travel.booking.Booking> bookingsById = new HashMap<>();
        if (!bookingIds.isEmpty()) {
            bookingRepository.findAllById(bookingIds)
                    .forEach(b -> bookingsById.put(b.getId(), b));
        }

        // Collect all user IDs to resolve names (ledger userId + bookedByUserId + approvedByUserId)
        Map<Long, String> userNames = new HashMap<>();
        java.util.stream.Stream.concat(
                entries.stream().map(LedgerEntry::getUserId),
                bookingsById.values().stream().flatMap(b ->
                        java.util.stream.Stream.of(b.getBookedByUserId(), b.getApprovedByUserId()))
        ).filter(id -> id != null).distinct()
                .forEach(id -> userRepository.findById(id)
                        .ifPresent(u -> userNames.put(id, u.getFirstName() + " " + u.getLastName())));

        // Batch-resolve bookable titles
        Map<Long, String> bookableTitles = new HashMap<>();
        bookingsById.forEach((id, b) ->
                bookableTitles.put(id, resolveBookableTitle(b.getBookableType(), b.getBookableId())));

        return entries.stream()
                .map(e -> {
                    com.example.travel.booking.Booking booking =
                            e.getBookingId() != null ? bookingsById.get(e.getBookingId()) : null;
                    return new LedgerEntryDto(
                            e.getId(),
                            e.getUserId(),
                            userNames.get(e.getUserId()),
                            e.getBookingId(),
                            e.getEntryType().name(),
                            e.getAmount(),
                            e.getCurrency(),
                            e.getMemo(),
                            e.getCreatedAt(),
                            e.getBookingId() != null ? bookableTitles.get(e.getBookingId()) : null,
                            booking != null ? booking.getBookedByUserId() : null,
                            booking != null ? userNames.get(booking.getBookedByUserId()) : null,
                            booking != null ? booking.getApprovedByUserId() : null,
                            booking != null ? userNames.get(booking.getApprovedByUserId()) : null,
                            booking != null ? booking.getStatus().name() : null,
                            booking != null ? booking.getGrossTotal() : null,
                            booking != null ? booking.getNetTotal() : null,
                            booking != null ? booking.getBookableType() : null
                    );
                })
                .collect(Collectors.toList());
    }

    private String resolveBookableTitle(String bookableType, Long bookableId) {
        if (bookableType == null || bookableId == null) return null;
        return switch (bookableType.toLowerCase()) {
            case "flight" -> flightRepository.findById(bookableId)
                    .map(f -> {
                        String airline = (f.getAirline() != null) ? f.getAirline().getCode() + " " : "";
                        var legs = flightLegRepository.findByFlightIdOrderByLegOrder(f.getId());
                        String route = legs.isEmpty() ? "?"
                                : legs.stream().map(l -> l.getOrigin()).reduce((a, b) -> a + " → " + b).orElse("?")
                                  + " → " + legs.get(legs.size() - 1).getDestination();
                        return airline + route;
                    }).orElse("Flight #" + bookableId);
            case "umrah" -> umrahPackageRepository.findById(bookableId)
                    .map(UmrahPackage::getTitle).orElse("Umrah #" + bookableId);
            case "hajj" -> hajjPackageRepository.findById(bookableId)
                    .map(HajjPackage::getTitle).orElse("Hajj #" + bookableId);
            case "custom" -> customPackageRepository.findById(bookableId)
                    .map(c -> c.getPackageType() + ": " + c.getTitle())
                    .orElse("Custom #" + bookableId);
            default -> bookableType + " #" + bookableId;
        };
    }

    public record AdjustmentRequest(Long childUserId, BigDecimal amount, String currency, String memo) {}
}
