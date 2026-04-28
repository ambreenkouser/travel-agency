package com.example.travel.booking;

import com.example.travel.agency.AgencyRepository;
import com.example.travel.tenancy.AgencyContext;
import jakarta.persistence.EntityNotFoundException;
import java.time.Instant;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final PassengerRepository passengerRepository;
    private final LedgerService ledgerService;
    private final PricingService pricingService;
    private final InvoiceService invoiceService;
    private final AgencyRepository agencyRepository;
    private final BookingCancellationRequestRepository cancellationRequestRepository;

    public BookingService(BookingRepository bookingRepository,
                          PassengerRepository passengerRepository,
                          LedgerService ledgerService,
                          PricingService pricingService,
                          InvoiceService invoiceService,
                          AgencyRepository agencyRepository,
                          BookingCancellationRequestRepository cancellationRequestRepository) {
        this.bookingRepository = bookingRepository;
        this.passengerRepository = passengerRepository;
        this.ledgerService = ledgerService;
        this.pricingService = pricingService;
        this.invoiceService = invoiceService;
        this.agencyRepository = agencyRepository;
        this.cancellationRequestRepository = cancellationRequestRepository;
    }

    public List<Booking> findAll() {
        return bookingRepository.findAll();
    }

    public List<Booking> findByUser(Long userId) {
        return bookingRepository.findByBookedByUserId(userId);
    }

    public Booking findById(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Booking not found: " + id));
    }

    /**
     * Creates a PENDING booking with passengers and computes pricing snapshot.
     * No ledger entry is written at this stage.
     */
    @Transactional
    public Booking createPending(Booking booking, Iterable<Passenger> passengers, PricingInput pricingInput) {
        booking.setAgencyId(AgencyContext.getCurrentAgencyId());
        agencyRepository.findById(booking.getAgencyId()).ifPresent(agency -> {
            int minutes = agency.getBookingExpiryMinutes() != null ? agency.getBookingExpiryMinutes() : 60;
            booking.setExpiresAt(Instant.now().plusSeconds(minutes * 60L));
        });
        PricingBreakdown breakdown = pricingService.calculate(pricingInput);
        booking.setGrossTotal(breakdown.gross());
        booking.setNetTotal(breakdown.net());
        booking.setTaxTotal(breakdown.tax());
        booking.setPricingSnapshot(breakdown.components());
        Booking saved = bookingRepository.save(booking);
        for (Passenger p : passengers) {
            p.setBooking(saved);
            passengerRepository.save(p);
        }
        return saved;
    }

    /**
     * Confirms a PENDING booking.
     * DEBIT for the agent, CREDIT for the approver (parent).
     */
    @Transactional
    public Booking confirm(Long bookingId, String comment, Long approverId) {
        Booking booking = findById(bookingId);
        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new IllegalStateException("Cannot confirm a cancelled booking");
        }
        if (booking.getStatus() == BookingStatus.CONFIRMED) {
            throw new IllegalStateException("Booking is already confirmed");
        }
        booking.setStatus(BookingStatus.CONFIRMED);
        if (comment != null && !comment.isBlank()) booking.setPaymentComment(comment);
        if (approverId != null) booking.setApprovedByUserId(approverId);
        bookingRepository.save(booking);

        ledgerService.debit(booking,
                "Booking #" + bookingId + " confirmed — " + booking.getBookableType() + " #" + booking.getBookableId());

        invoiceService.generateInvoicePdf(bookingId, booking);
        return booking;
    }

    /**
     * Cancels a PENDING booking.
     * If cancelled by a different user than the booker (parent rejection):
     *   → CREDIT for agent + DEBIT for the rejecting parent.
     * If self-cancelled by the agent:
     *   → No ledger entries (booking was never confirmed).
     * For CONFIRMED bookings: use requestCancellation() instead.
     */
    @Transactional
    public Booking cancel(Long bookingId, String comment, Long cancelledByUserId) {
        Booking booking = findById(bookingId);

        if (booking.getStatus() == BookingStatus.CONFIRMED ||
                booking.getStatus() == BookingStatus.CANCELLATION_REQUESTED) {
            throw new IllegalStateException(
                    "Confirmed bookings cannot be cancelled directly. Submit a cancellation request.");
        }
        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new IllegalStateException("Booking is already cancelled");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        if (comment != null && !comment.isBlank()) booking.setPaymentComment(comment);
        bookingRepository.save(booking);

        // Parent rejection of a PENDING booking → record in ledger
        boolean isParentRejection = cancelledByUserId != null
                && !cancelledByUserId.equals(booking.getBookedByUserId());
        if (isParentRejection) {
            ledgerService.reject(booking, cancelledByUserId,
                    "Booking #" + bookingId + " rejected — " + booking.getBookableType());
        }
        return booking;
    }

    /**
     * Agent requests cancellation of a CONFIRMED booking.
     * Sets status to CANCELLATION_REQUESTED and creates a pending cancellation request record.
     * The parent must approve/reject via approveCancellation / rejectCancellation.
     */
    @Transactional
    public Booking requestCancellation(Long bookingId, String reason, Long requesterId) {
        Booking booking = findById(bookingId);

        if (booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new IllegalStateException("Only confirmed bookings can be requested for cancellation.");
        }
        if (!requesterId.equals(booking.getBookedByUserId())) {
            throw new IllegalStateException("Only the booking owner can request cancellation.");
        }
        cancellationRequestRepository.findByBookingIdAndStatus(bookingId, "PENDING").ifPresent(r -> {
            throw new IllegalStateException("A cancellation request is already pending for this booking.");
        });

        BookingCancellationRequest req = new BookingCancellationRequest();
        req.setBookingId(bookingId);
        req.setRequestedByUserId(requesterId);
        req.setAgencyId(booking.getAgencyId());
        req.setStatus("PENDING");
        req.setReason(reason);
        cancellationRequestRepository.save(req);

        booking.setStatus(BookingStatus.CANCELLATION_REQUESTED);
        return bookingRepository.save(booking);
    }

    /**
     * Parent approves a cancellation request.
     * → Booking CANCELLED + CREDIT for agent + DEBIT for parent.
     */
    @Transactional
    public Booking approveCancellation(Long requestId, String comment, Long approverId) {
        BookingCancellationRequest req = cancellationRequestRepository.findById(requestId)
                .orElseThrow(() -> new EntityNotFoundException("Cancellation request not found: " + requestId));
        if (!"PENDING".equals(req.getStatus())) {
            throw new IllegalStateException("Cancellation request is not pending.");
        }

        req.setStatus("APPROVED");
        req.setParentComment(comment);
        cancellationRequestRepository.save(req);

        Booking booking = findById(req.getBookingId());
        booking.setStatus(BookingStatus.CANCELLED);
        if (comment != null && !comment.isBlank()) booking.setPaymentComment(comment);
        bookingRepository.save(booking);

        // Reverse the ledger: CREDIT for agent, DEBIT for parent (original approver)
        ledgerService.credit(booking,
                "Cancellation approved — reversal of booking #" + booking.getId());

        return booking;
    }

    /**
     * Parent rejects a cancellation request.
     * → Booking restored to CONFIRMED, no ledger change.
     */
    @Transactional
    public Booking rejectCancellation(Long requestId, String comment) {
        BookingCancellationRequest req = cancellationRequestRepository.findById(requestId)
                .orElseThrow(() -> new EntityNotFoundException("Cancellation request not found: " + requestId));
        if (!"PENDING".equals(req.getStatus())) {
            throw new IllegalStateException("Cancellation request is not pending.");
        }

        req.setStatus("REJECTED");
        req.setParentComment(comment);
        cancellationRequestRepository.save(req);

        Booking booking = findById(req.getBookingId());
        booking.setStatus(BookingStatus.CONFIRMED);
        return bookingRepository.save(booking);
    }
}
