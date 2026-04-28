package com.example.travel.booking;

import java.math.BigDecimal;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LedgerService {

    private final LedgerEntryRepository repository;

    public LedgerService(LedgerEntryRepository repository) {
        this.repository = repository;
    }

    /**
     * Called when a booking is CONFIRMED.
     * Creates two entries:
     *  - DEBIT  for the agent  (they owe the cost to parent)
     *  - CREDIT for the parent (they received an order/payment from agent)
     */
    @Transactional
    public void debit(Booking booking, String memo) {
        Long agencyId = booking.getAgencyId();
        BigDecimal amount = booking.getNetTotal();
        String currency = booking.getCurrency() != null ? booking.getCurrency() : "PKR";

        if (booking.getBookedByUserId() != null) {
            repository.save(build(booking.getBookedByUserId(), agencyId,
                    booking.getId(), LedgerEntryType.DEBIT, amount, currency, memo));
        }

        if (booking.getApprovedByUserId() != null) {
            String parentMemo = memo + " — received from agent";
            repository.save(build(booking.getApprovedByUserId(), agencyId,
                    booking.getId(), LedgerEntryType.CREDIT, amount, currency, parentMemo));
        }
    }

    /**
     * Called when a CONFIRMED booking is CANCELLED.
     * Reverses the entries:
     *  - CREDIT for the agent  (refund / debt reversed)
     *  - DEBIT  for the parent (amount returned to agent)
     */
    @Transactional
    public void credit(Booking booking, String memo) {
        Long agencyId = booking.getAgencyId();
        BigDecimal amount = booking.getNetTotal();
        String currency = booking.getCurrency() != null ? booking.getCurrency() : "PKR";

        if (booking.getBookedByUserId() != null) {
            repository.save(build(booking.getBookedByUserId(), agencyId,
                    booking.getId(), LedgerEntryType.CREDIT, amount, currency, memo));
        }

        if (booking.getApprovedByUserId() != null) {
            String parentMemo = memo + " — returned to agent";
            repository.save(build(booking.getApprovedByUserId(), agencyId,
                    booking.getId(), LedgerEntryType.DEBIT, amount, currency, parentMemo));
        }
    }

    /**
     * Called when a parent REJECTS a PENDING booking.
     * The booking was never confirmed (no money exchanged), but we record the decision:
     *  - CREDIT for the agent  (the obligation is released)
     *  - DEBIT  for the parent (they absorbed the rejection)
     */
    @Transactional
    public void reject(Booking booking, Long rejecterId, String memo) {
        Long agencyId = booking.getAgencyId();
        BigDecimal amount = booking.getNetTotal();
        String currency = booking.getCurrency() != null ? booking.getCurrency() : "PKR";

        if (booking.getBookedByUserId() != null) {
            repository.save(build(booking.getBookedByUserId(), agencyId,
                    booking.getId(), LedgerEntryType.CREDIT, amount, currency, memo));
        }

        if (rejecterId != null && !rejecterId.equals(booking.getBookedByUserId())) {
            String parentMemo = memo + " — booking rejected";
            repository.save(build(rejecterId, agencyId,
                    booking.getId(), LedgerEntryType.DEBIT, amount, currency, parentMemo));
        }
    }

    /**
     * Manual adjustment: parent credits a child user's account.
     *  - ADJUSTMENT/CREDIT for child (reduces what they owe)
     *  - ADJUSTMENT/DEBIT  for parent (reduces what's due from child)
     */
    @Transactional
    public void createAdjustment(Long parentId, Long childId, Long agencyId,
                                  BigDecimal amount, String currency, String childName, String memo) {
        String curr = currency != null ? currency : "PKR";
        String childMemo  = "Adjustment from admin — " + (memo != null ? memo : "");
        String parentMemo = "Adjustment to " + childName + " — " + (memo != null ? memo : "");

        // CREDIT child — reduces what they owe
        LedgerEntry childEntry = new LedgerEntry();
        childEntry.setUserId(childId);
        childEntry.setAgencyId(agencyId);
        childEntry.setEntryType(LedgerEntryType.CREDIT);
        childEntry.setAmount(amount);
        childEntry.setCurrency(curr);
        childEntry.setMemo(childMemo);
        repository.save(childEntry);

        // DEBIT parent — they are giving credit out
        LedgerEntry parentEntry = new LedgerEntry();
        parentEntry.setUserId(parentId);
        parentEntry.setAgencyId(agencyId);
        parentEntry.setEntryType(LedgerEntryType.DEBIT);
        parentEntry.setAmount(amount);
        parentEntry.setCurrency(curr);
        parentEntry.setMemo(parentMemo);
        repository.save(parentEntry);
    }

    public List<LedgerEntry> findByBooking(Long bookingId) {
        return repository.findByBookingId(bookingId);
    }

    public List<LedgerEntry> findByUser(Long userId) {
        return repository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    /** All entries for the current agency (Hibernate filter applied). */
    public List<LedgerEntry> findAll() {
        return repository.findAll();
    }

    private LedgerEntry build(Long userId, Long agencyId, Long bookingId,
                               LedgerEntryType type, BigDecimal amount, String currency, String memo) {
        LedgerEntry e = new LedgerEntry();
        e.setUserId(userId);
        e.setAgencyId(agencyId);
        e.setBookingId(bookingId);
        e.setEntryType(type);
        e.setAmount(amount);
        e.setCurrency(currency);
        e.setMemo(memo);
        return e;
    }
}
