package com.example.travel.api;

import com.example.travel.api.dto.BookingPaymentDto;
import com.example.travel.auth.AuthUserDetails;
import com.example.travel.booking.BookingService;
import com.example.travel.payment.Bank;
import com.example.travel.payment.BankRepository;
import com.example.travel.payment.BookingPayment;
import com.example.travel.payment.BookingPaymentRepository;
import com.example.travel.payment.PaymentAccount;
import com.example.travel.payment.PaymentAccountRepository;
import jakarta.persistence.EntityNotFoundException;
import java.io.IOException;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
@RequestMapping("/api/bookings/{bookingId}/payment")
public class BookingPaymentRestController {

    private final BookingPaymentRepository bookingPaymentRepository;
    private final PaymentAccountRepository paymentAccountRepository;
    private final BankRepository bankRepository;
    private final BookingService bookingService;

    public BookingPaymentRestController(BookingPaymentRepository bookingPaymentRepository,
                                         PaymentAccountRepository paymentAccountRepository,
                                         BankRepository bankRepository,
                                         BookingService bookingService) {
        this.bookingPaymentRepository = bookingPaymentRepository;
        this.paymentAccountRepository = paymentAccountRepository;
        this.bankRepository = bankRepository;
        this.bookingService = bookingService;
    }

    /** Submit a payment slip for a booking. */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('bookings:create')")
    public BookingPaymentDto submitSlip(
            @PathVariable Long bookingId,
            @RequestParam Long paymentAccountId,
            @RequestParam String referenceNumber,
            @RequestParam(required = false) MultipartFile slipImage,
            @AuthenticationPrincipal AuthUserDetails principal) throws IOException {

        // Verify booking exists and belongs to caller
        var booking = bookingService.findById(bookingId);

        // Verify payment account exists
        PaymentAccount account = paymentAccountRepository.findById(paymentAccountId)
                .orElseThrow(() -> new EntityNotFoundException("Payment account not found"));

        // Upsert — replace if already submitted
        BookingPayment bp = bookingPaymentRepository.findByBookingId(bookingId)
                .orElse(new BookingPayment());
        bp.setBookingId(bookingId);
        bp.setPaymentAccountId(paymentAccountId);
        bp.setReferenceNumber(referenceNumber);
        bp.setSubmittedByUserId(principal.getUserId());

        if (slipImage != null && !slipImage.isEmpty()) {
            bp.setSlipImageData(slipImage.getBytes());
            bp.setSlipContentType(slipImage.getContentType());
        }

        BookingPayment saved = bookingPaymentRepository.save(bp);
        return toDto(saved, account);
    }

    /** Get slip info for a booking. */
    @GetMapping
    @PreAuthorize("hasAuthority('bookings:view')")
    public BookingPaymentDto getPayment(@PathVariable Long bookingId) {
        BookingPayment bp = bookingPaymentRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No payment submitted yet"));
        PaymentAccount account = paymentAccountRepository.findById(bp.getPaymentAccountId()).orElse(null);
        return toDto(bp, account);
    }

    /** Serve the slip image stored in the database (auth-gated). */
    @GetMapping("/slip")
    @PreAuthorize("hasAuthority('bookings:view')")
    public ResponseEntity<byte[]> getSlip(@PathVariable Long bookingId) {
        BookingPayment bp = bookingPaymentRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No slip uploaded"));
        if (bp.getSlipImageData() == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No slip image");
        }
        MediaType mediaType = bp.getSlipContentType() != null
                ? MediaType.parseMediaType(bp.getSlipContentType())
                : MediaType.IMAGE_JPEG;
        return ResponseEntity.ok().contentType(mediaType).body(bp.getSlipImageData());
    }

    private BookingPaymentDto toDto(BookingPayment bp, PaymentAccount account) {
        Bank bank = (account != null && account.getBankId() != null)
                ? bankRepository.findById(account.getBankId()).orElse(null) : null;
        return new BookingPaymentDto(
                bp.getId(),
                bp.getPaymentAccountId(),
                account != null ? account.getAccountName() : null,
                account != null ? account.getAccountTitle() : null,
                bank != null ? bank.getName() : null,
                bank != null ? bank.getType() : null,
                account != null ? account.getBankAccountNumber() : null,
                bp.getReferenceNumber(),
                bp.getSlipImageData() != null,
                bp.getCreatedAt()
        );
    }
}
