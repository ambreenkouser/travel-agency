package com.example.travel.api;

import com.example.travel.api.dto.ApprovalActionRequest;
import com.example.travel.api.dto.BookingDto;
import com.example.travel.api.dto.BookingPaymentDto;
import com.example.travel.api.dto.CreateBookingRequest;
import com.example.travel.api.dto.LedgerEntryDto;
import com.example.travel.payment.Bank;
import com.example.travel.payment.BankRepository;
import com.example.travel.payment.BookingPayment;
import com.example.travel.payment.BookingPaymentRepository;
import com.example.travel.payment.PaymentAccount;
import com.example.travel.payment.PaymentAccountRepository;
import com.example.travel.api.mapper.BookingMapper;
import com.example.travel.auth.AuthUserDetails;
import com.example.travel.auth.User;
import com.example.travel.auth.UserRepository;
import com.example.travel.booking.Booking;
import com.example.travel.booking.BookingRepository;
import com.example.travel.booking.BookingService;
import com.example.travel.booking.BookingStatus;
import com.example.travel.booking.LedgerEntry;
import com.example.travel.booking.LedgerService;
import com.example.travel.booking.Passenger;
import com.example.travel.booking.PassengerRepository;
import com.example.travel.booking.PassengerType;
import com.example.travel.booking.PricingInput;
import com.example.travel.flight.Flight;
import com.example.travel.flight.FlightRepository;
import com.example.travel.hajj.HajjPackage;
import com.example.travel.hajj.HajjPackageRepository;
import com.example.travel.umrah.UmrahPackage;
import com.example.travel.umrah.UmrahPackageAirline;
import com.example.travel.umrah.UmrahPackageAirlineRepository;
import com.example.travel.umrah.UmrahPackageRepository;
import com.example.travel.booking.BookingCancellationRequest;
import com.example.travel.booking.BookingCancellationRequestRepository;
import com.example.travel.booking.InvoiceService;
import com.example.travel.offer.Offer;
import com.example.travel.offer.OfferRepository;
import jakarta.persistence.EntityNotFoundException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
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
@RequestMapping("/api/bookings")
public class BookingRestController {

    private final BookingService bookingService;
    private final LedgerService ledgerService;
    private final InvoiceService invoiceService;
    private final FlightRepository flightRepository;
    private final UmrahPackageRepository umrahPackageRepository;
    private final HajjPackageRepository hajjPackageRepository;
    private final BookingRepository bookingRepository;
    private final PassengerRepository passengerRepository;
    private final UmrahPackageAirlineRepository umrahPackageAirlineRepository;
    private final BookingMapper bookingMapper;
    private final UserRepository userRepository;
    private final BookingPaymentRepository bookingPaymentRepository;
    private final PaymentAccountRepository paymentAccountRepository;
    private final BankRepository bankRepository;
    private final OfferRepository offerRepository;
    private final BookingCancellationRequestRepository cancellationRequestRepository;

    public BookingRestController(BookingService bookingService,
                                 LedgerService ledgerService,
                                 InvoiceService invoiceService,
                                 FlightRepository flightRepository,
                                 UmrahPackageRepository umrahPackageRepository,
                                 HajjPackageRepository hajjPackageRepository,
                                 BookingRepository bookingRepository,
                                 PassengerRepository passengerRepository,
                                 UmrahPackageAirlineRepository umrahPackageAirlineRepository,
                                 BookingMapper bookingMapper,
                                 UserRepository userRepository,
                                 BookingPaymentRepository bookingPaymentRepository,
                                 PaymentAccountRepository paymentAccountRepository,
                                 BankRepository bankRepository,
                                 OfferRepository offerRepository,
                                 BookingCancellationRequestRepository cancellationRequestRepository) {
        this.bookingService = bookingService;
        this.ledgerService = ledgerService;
        this.invoiceService = invoiceService;
        this.flightRepository = flightRepository;
        this.umrahPackageRepository = umrahPackageRepository;
        this.hajjPackageRepository = hajjPackageRepository;
        this.bookingRepository = bookingRepository;
        this.passengerRepository = passengerRepository;
        this.umrahPackageAirlineRepository = umrahPackageAirlineRepository;
        this.bookingMapper = bookingMapper;
        this.userRepository = userRepository;
        this.bookingPaymentRepository = bookingPaymentRepository;
        this.paymentAccountRepository = paymentAccountRepository;
        this.bankRepository = bankRepository;
        this.offerRepository = offerRepository;
        this.cancellationRequestRepository = cancellationRequestRepository;
    }

    /** All agency bookings — for agency admins / agents. */
    @GetMapping
    @PreAuthorize("hasAuthority('bookings:view')")
    public List<BookingDto> list() {
        return bookingService.findAll().stream()
                .map(b -> enrich(bookingMapper.toDto(b), b.getBookedByUserId()))
                .collect(Collectors.toList());
    }

    /** Current user's own bookings only. */
    @GetMapping("/my")
    @PreAuthorize("hasAuthority('bookings:view')")
    public List<BookingDto> myBookings(@AuthenticationPrincipal AuthUserDetails principal) {
        return bookingService.findByUser(principal.getUserId()).stream()
                .map(b -> enrich(bookingMapper.toDto(b), b.getBookedByUserId()))
                .collect(Collectors.toList());
    }

    /**
     * Approval queue — PENDING bookings from direct children only.
     * Every user (regardless of level) only sees requests from users whose parentId = their own id.
     */
    @GetMapping("/queue")
    @PreAuthorize("hasAuthority('bookings:confirm')")
    public List<BookingDto> queue(@AuthenticationPrincipal AuthUserDetails principal) {
        List<Long> childIds = userRepository.findByParentId(principal.getUserId()).stream()
                .map(User::getId).collect(Collectors.toList());
        if (childIds.isEmpty()) return List.of();
        List<Booking> bookings = bookingRepository.findByStatusAndBookedByUserIdIn(
                BookingStatus.PENDING, childIds);
        return bookings.stream()
                .map(b -> enrich(bookingMapper.toDto(b), b.getBookedByUserId()))
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('bookings:view')")
    public BookingDto getById(@PathVariable Long id) {
        Booking b = bookingService.findById(id);
        return enrich(bookingMapper.toDto(b), b.getBookedByUserId());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('bookings:create')")
    public BookingDto create(@RequestBody CreateBookingRequest request,
                             @AuthenticationPrincipal AuthUserDetails principal) {
        Booking booking = new Booking();
        booking.setBookableType(request.bookableType());
        booking.setBookableId(request.bookableId());
        booking.setBookedByUserId(principal.getUserId());
        booking.setSelectedAirlineId(request.selectedAirlineId());
        booking.setSelectedHotelId(request.selectedHotelId());

        List<Passenger> passengers = request.passengers().stream().map(pr -> {
            Passenger p = new Passenger();
            p.setType(PassengerType.valueOf(pr.type().toUpperCase()));
            p.setFirstName(pr.firstName());
            p.setLastName(pr.lastName());
            p.setPassportNo(pr.passportNo());
            p.setNationality(pr.nationality());
            p.setDateOfBirth(pr.dateOfBirth());
            return p;
        }).collect(Collectors.toList());

        PricingInput pricing = buildPricingInput(request, passengers, principal.getUserId());
        Booking saved = bookingService.createPending(booking, passengers, pricing);
        return enrich(bookingMapper.toDto(saved), saved.getBookedByUserId());
    }

    @PostMapping("/{id}/confirm")
    @PreAuthorize("hasAuthority('bookings:confirm')")
    public BookingDto confirm(@PathVariable Long id,
                              @RequestBody(required = false) ApprovalActionRequest body,
                              @AuthenticationPrincipal AuthUserDetails principal) {
        // Level 4 agents cannot confirm any booking — must be approved by parent
        if (principal.getUserTypeLevel() >= 4) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Agents cannot confirm bookings. Please wait for your admin to approve.");
        }
        // Level 3+ users cannot self-confirm their own bookings
        Booking booking = bookingService.findById(id);
        if (principal.getUserTypeLevel() >= 3 &&
                principal.getUserId().equals(booking.getBookedByUserId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You cannot confirm your own booking.");
        }
        String comment = body != null ? body.comment() : null;
        Booking b = bookingService.confirm(id, comment, principal.getUserId());
        return enrich(bookingMapper.toDto(b), b.getBookedByUserId());
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAuthority('bookings:cancel') or hasAuthority('bookings:confirm')")
    public BookingDto cancel(@PathVariable Long id,
                             @RequestBody(required = false) ApprovalActionRequest body,
                             @AuthenticationPrincipal AuthUserDetails principal) {
        String comment = body != null ? body.comment() : null;
        Booking b = bookingService.cancel(id, comment, principal.getUserId());
        return enrich(bookingMapper.toDto(b), b.getBookedByUserId());
    }

    /** Agent requests cancellation of a confirmed (paid) booking. */
    @PostMapping("/{id}/request-cancellation")
    @PreAuthorize("hasAuthority('bookings:cancel') or hasAuthority('bookings:create')")
    public BookingDto requestCancellation(@PathVariable Long id,
                                          @RequestBody(required = false) ApprovalActionRequest body,
                                          @AuthenticationPrincipal AuthUserDetails principal) {
        String reason = body != null ? body.comment() : null;
        Booking b = bookingService.requestCancellation(id, reason, principal.getUserId());
        return enrich(bookingMapper.toDto(b), b.getBookedByUserId());
    }

    /** Parent views all PENDING cancellation requests from their direct children. */
    @GetMapping("/cancellation-requests")
    @PreAuthorize("hasAuthority('bookings:confirm')")
    public List<CancellationRequestDto> getCancellationRequests(
            @AuthenticationPrincipal AuthUserDetails principal) {
        List<Long> childIds = userRepository.findByParentId(principal.getUserId())
                .stream().map(com.example.travel.auth.User::getId).collect(Collectors.toList());
        if (childIds.isEmpty()) return List.of();
        return cancellationRequestRepository
                .findByRequestedByUserIdInAndStatusOrderByCreatedAtDesc(childIds, "PENDING")
                .stream().map(this::toCancellationDto).collect(Collectors.toList());
    }

    /** Parent approves a cancellation request → booking cancelled + ledger reversal. */
    @PostMapping("/cancellation-requests/{requestId}/approve")
    @PreAuthorize("hasAuthority('bookings:confirm')")
    public BookingDto approveCancellation(@PathVariable Long requestId,
                                          @RequestBody(required = false) ApprovalActionRequest body,
                                          @AuthenticationPrincipal AuthUserDetails principal) {
        String comment = body != null ? body.comment() : null;
        Booking b = bookingService.approveCancellation(requestId, comment, principal.getUserId());
        return enrich(bookingMapper.toDto(b), b.getBookedByUserId());
    }

    /** Parent rejects a cancellation request → booking restored to CONFIRMED. */
    @PostMapping("/cancellation-requests/{requestId}/reject")
    @PreAuthorize("hasAuthority('bookings:confirm')")
    public BookingDto rejectCancellation(@PathVariable Long requestId,
                                          @RequestBody(required = false) ApprovalActionRequest body) {
        String comment = body != null ? body.comment() : null;
        Booking b = bookingService.rejectCancellation(requestId, comment);
        return enrich(bookingMapper.toDto(b), b.getBookedByUserId());
    }

    @GetMapping("/{id}/ledger")
    @PreAuthorize("hasAuthority('bookings:view')")
    public List<LedgerEntryDto> ledgerForBooking(@PathVariable Long id) {
        bookingService.findById(id); // 404 if not found
        return ledgerService.findByBooking(id).stream()
                .map(this::toLedgerDto)
                .collect(Collectors.toList());
    }

    // ── Pricing resolution ──────────────────────────────────────────────────

    private PricingInput buildPricingInput(CreateBookingRequest request, List<Passenger> passengers, Long userId) {
        int adults   = count(passengers, PassengerType.ADULT);
        int children = count(passengers, PassengerType.CHILD);
        int infants  = count(passengers, PassengerType.INFANT);
        int total    = adults + children + infants;

        BigDecimal fareAdult       = BigDecimal.ZERO;
        BigDecimal fareChild       = BigDecimal.ZERO;
        BigDecimal fareInfant      = BigDecimal.ZERO;
        BigDecimal taxPerPassenger = BigDecimal.ZERO;

        switch (request.bookableType().toLowerCase()) {
            case "flight" -> {
                Flight f = flightRepository.findById(request.bookableId())
                        .orElseThrow(() -> new EntityNotFoundException("Flight not found: " + request.bookableId()));

                // Seat quota check
                if (f.getSeatQuota() != null) {
                    int occupied = bookingRepository
                            .findByBookableTypeAndBookableId("flight", f.getId())
                            .stream()
                            .filter(b -> b.getStatus() != BookingStatus.CANCELLED)
                            .mapToInt(b -> passengerRepository.findByBookingId(b.getId()).size())
                            .sum();
                    int available = Math.max(0, f.getSeatQuota() - occupied);
                    if (available < total) {
                        throw new IllegalStateException(
                                "Not enough seats on this flight. Only " + available + " seat(s) remaining.");
                    }
                }

                java.math.BigDecimal multiplier = (f.getRoute() != null && f.getRoute().isRoundTrip())
                        ? BigDecimal.valueOf(2) : BigDecimal.ONE;
                fareAdult  = nvl(f.getFareAdult()).multiply(multiplier);
                fareChild  = nvl(f.getFareChild()).multiply(multiplier);
                fareInfant = nvl(f.getFareInfant()).multiply(multiplier);
                if (total > 0 && f.getTaxTotal() != null) {
                    taxPerPassenger = f.getTaxTotal().multiply(multiplier)
                            .divide(BigDecimal.valueOf(total), 2, RoundingMode.HALF_UP);
                }
            }
            case "umrah" -> {
                UmrahPackage u = umrahPackageRepository.findById(request.bookableId())
                        .orElseThrow(() -> new EntityNotFoundException("Umrah package not found: " + request.bookableId()));
                if (request.selectedAirlineId() != null) {
                    UmrahPackageAirline upa = umrahPackageAirlineRepository
                            .findByUmrahPackageIdAndAirline_Id(u.getId(), request.selectedAirlineId())
                            .orElseThrow(() -> new EntityNotFoundException(
                                    "Airline not linked to this Umrah package"));
                    int occupied = bookingRepository
                            .findByBookableTypeAndBookableId("umrah", u.getId())
                            .stream()
                            .filter(b -> b.getStatus() != BookingStatus.CANCELLED
                                    && request.selectedAirlineId().equals(b.getSelectedAirlineId()))
                            .mapToInt(b -> passengerRepository.findByBookingId(b.getId()).size())
                            .sum();
                    int available = Math.max(0, upa.getAllocatedSeats() - occupied);
                    if (available < total) {
                        throw new IllegalStateException(
                                "Not enough seats on this airline. Only " + available + " seat(s) remaining.");
                    }
                }
                fareAdult  = nvl(u.getBasePrice());
                fareChild  = u.getPriceChild()  != null ? u.getPriceChild()  : nvl(u.getBasePrice());
                fareInfant = u.getPriceInfant() != null ? u.getPriceInfant() : nvl(u.getBasePrice());
            }
            case "hajj" -> {
                HajjPackage h = hajjPackageRepository.findById(request.bookableId())
                        .orElseThrow(() -> new EntityNotFoundException("Hajj package not found: " + request.bookableId()));
                fareAdult  = nvl(h.getBasePrice());
                fareChild  = nvl(h.getBasePrice());
                fareInfant = nvl(h.getBasePrice());
            }
        }

        BigDecimal extrasFees = request.extrasFee() != null ? request.extrasFee() : BigDecimal.ZERO;

        // Apply the best active, valid discount offer for this user
        BigDecimal discount = resolveOfferDiscount(userId,
                adults, children, infants,
                fareAdult, fareChild, fareInfant, taxPerPassenger, extrasFees);

        return new PricingInput(adults, children, infants, fareAdult, fareChild, fareInfant,
                taxPerPassenger, extrasFees, discount);
    }

    /**
     * Looks up all active, date-valid offers for the given user and returns
     * the total discount amount in PKR (FIXED offers applied directly;
     * PERCENTAGE offers applied against the pre-discount gross).
     */
    private BigDecimal resolveOfferDiscount(Long userId,
                                             int adults, int children, int infants,
                                             BigDecimal fareAdult, BigDecimal fareChild, BigDecimal fareInfant,
                                             BigDecimal taxPerPassenger, BigDecimal fees) {
        List<Offer> offers = offerRepository.findByTargetUserIdAndActiveTrueOrderByCreatedAtDesc(userId);
        if (offers.isEmpty()) return BigDecimal.ZERO;

        LocalDate today = LocalDate.now();
        int totalPax = adults + children + infants;

        // Pre-discount gross (for percentage calculation)
        BigDecimal roughGross = fareAdult.multiply(BigDecimal.valueOf(adults))
                .add(fareChild.multiply(BigDecimal.valueOf(children)))
                .add(fareInfant.multiply(BigDecimal.valueOf(infants)))
                .add(taxPerPassenger.multiply(BigDecimal.valueOf(totalPax)))
                .add(fees);

        BigDecimal total = BigDecimal.ZERO;
        for (Offer offer : offers) {
            if (offer.getValidFrom()  != null && today.isBefore(offer.getValidFrom()))  continue;
            if (offer.getValidUntil() != null && today.isAfter(offer.getValidUntil()))  continue;
            BigDecimal d;
            if ("PERCENTAGE".equals(offer.getDiscountType())) {
                d = roughGross.multiply(offer.getDiscountValue())
                        .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            } else {
                d = offer.getDiscountValue();
            }
            total = total.add(d);
        }
        // Cap discount at gross so net never goes negative
        return total.min(roughGross).max(BigDecimal.ZERO);
    }

    @GetMapping(value = "/{id}/invoice", produces = MediaType.APPLICATION_PDF_VALUE)
    @PreAuthorize("hasAuthority('bookings:view')")
    public ResponseEntity<byte[]> downloadInvoice(@PathVariable Long id) {
        bookingService.findById(id);
        byte[] pdf = invoiceService.getInvoiceBytes(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"invoice-" + id + ".pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private BookingDto enrich(BookingDto dto, Long bookedByUserId) {
        String name = bookedByUserId == null ? null : userRepository.findById(bookedByUserId)
                .map(u -> u.getFirstName() + " " + u.getLastName())
                .orElse(null);
        BookingPaymentDto payment = bookingPaymentRepository.findByBookingId(dto.id())
                .map(bp -> {
                    PaymentAccount acct = paymentAccountRepository.findById(bp.getPaymentAccountId()).orElse(null);
                    Bank bank = (acct != null && acct.getBankId() != null)
                            ? bankRepository.findById(acct.getBankId()).orElse(null) : null;
                    return new BookingPaymentDto(
                            bp.getId(),
                            bp.getPaymentAccountId(),
                            acct != null ? acct.getAccountName() : null,
                            acct != null ? acct.getAccountTitle() : null,
                            bank != null ? bank.getName() : null,
                            bank != null ? bank.getType() : null,
                            acct != null ? acct.getBankAccountNumber() : null,
                            bp.getReferenceNumber(),
                            bp.getSlipImagePath() != null,
                            bp.getCreatedAt()
                    );
                }).orElse(null);
        return new BookingDto(
                dto.id(), dto.bookableType(), dto.bookableId(), dto.status(),
                dto.grossTotal(), dto.netTotal(), dto.taxTotal(), dto.currency(),
                dto.createdAt(), dto.expiresAt(), dto.passengers(),
                dto.bookedByUserId(), name,
                dto.paymentComment(), dto.approvedByUserId(), payment
        );
    }

    private int count(List<Passenger> passengers, PassengerType type) {
        return (int) passengers.stream().filter(p -> p.getType() == type).count();
    }

    private BigDecimal nvl(BigDecimal v) {
        return v != null ? v : BigDecimal.ZERO;
    }

    private CancellationRequestDto toCancellationDto(BookingCancellationRequest req) {
        String requesterName = req.getRequestedByUserId() == null ? null
                : userRepository.findById(req.getRequestedByUserId())
                        .map(u -> u.getFirstName() + " " + u.getLastName()).orElse(null);
        Booking booking = bookingService.findById(req.getBookingId());
        return new CancellationRequestDto(
                req.getId(), req.getBookingId(),
                req.getRequestedByUserId(), requesterName,
                req.getStatus(), req.getReason(), req.getParentComment(),
                req.getCreatedAt(),
                booking.getBookableType(), booking.getNetTotal(), booking.getCurrency()
        );
    }

    public record CancellationRequestDto(
            Long id,
            Long bookingId,
            Long requestedByUserId,
            String requestedByName,
            String status,
            String reason,
            String parentComment,
            java.time.Instant createdAt,
            String bookableType,
            java.math.BigDecimal netTotal,
            String currency
    ) {}

    private LedgerEntryDto toLedgerDto(LedgerEntry e) {
        String userName = e.getUserId() == null ? null : userRepository.findById(e.getUserId())
                .map(u -> u.getFirstName() + " " + u.getLastName()).orElse(null);
        return new LedgerEntryDto(
                e.getId(),
                e.getUserId(),
                userName,
                e.getBookingId(),
                e.getEntryType().name(),
                e.getAmount(),
                e.getCurrency(),
                e.getMemo(),
                e.getCreatedAt()
        );
    }
}
