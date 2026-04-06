package com.example.travel.booking;

import com.example.travel.tenancy.AgencyContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final PassengerRepository passengerRepository;
    private final LedgerEntryRepository ledgerRepository;
    private final PricingService pricingService;
    private final InvoiceService invoiceService;

    public BookingService(BookingRepository bookingRepository, PassengerRepository passengerRepository,
                          LedgerEntryRepository ledgerRepository, PricingService pricingService,
                          InvoiceService invoiceService) {
        this.bookingRepository = bookingRepository;
        this.passengerRepository = passengerRepository;
        this.ledgerRepository = ledgerRepository;
        this.pricingService = pricingService;
        this.invoiceService = invoiceService;
    }

    @Transactional
    public Booking createPending(Booking booking, Iterable<Passenger> passengers, PricingInput pricingInput) {
        booking.setAgencyId(AgencyContext.getCurrentAgencyId());
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

    @Transactional
    public Booking confirm(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId).orElseThrow();
        booking.setStatus(BookingStatus.CONFIRMED);
        bookingRepository.save(booking);

        LedgerEntry entry = new LedgerEntry();
        entry.setAgencyId(booking.getAgencyId());
        entry.setBookingId(booking.getId());
        entry.setEntryType(LedgerEntryType.DEBIT);
        entry.setAmount(booking.getNetTotal());
        entry.setCurrency(booking.getCurrency());
        entry.setMemo("Auto ledger on confirmation");
        ledgerRepository.save(entry);
        invoiceService.generateInvoicePdf(bookingId, booking);
        return booking;
    }
}
