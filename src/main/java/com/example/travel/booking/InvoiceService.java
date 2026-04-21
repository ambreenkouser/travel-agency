package com.example.travel.booking;

import com.example.travel.agency.Agency;
import com.example.travel.agency.AgencyRepository;
import com.lowagie.text.Chunk;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Image;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class InvoiceService {

    // Brand colours
    private static final Color PRIMARY    = new Color(37, 99, 235);   // blue-600
    private static final Color DARK       = new Color(17, 24, 39);    // gray-900
    private static final Color MID        = new Color(107, 114, 128); // gray-500
    private static final Color LIGHT_BG   = new Color(243, 244, 246); // gray-100
    private static final Color WHITE      = Color.WHITE;
    private static final Color BORDER     = new Color(209, 213, 219); // gray-300

    private static final DateTimeFormatter DATE_FMT =
            DateTimeFormatter.ofPattern("dd MMM yyyy, HH:mm").withZone(ZoneId.systemDefault());

    private final AgencyRepository agencyRepository;
    private final PassengerRepository passengerRepository;

    public InvoiceService(AgencyRepository agencyRepository,
                          PassengerRepository passengerRepository) {
        this.agencyRepository = agencyRepository;
        this.passengerRepository = passengerRepository;
    }

    public String generateInvoicePdf(Long bookingId, Booking booking) {
        try {
            Path dir = Path.of("files", "invoices");
            Files.createDirectories(dir);
            Path pdfPath = dir.resolve(bookingId + ".pdf");

            Agency agency = agencyRepository.findById(booking.getAgencyId()).orElse(null);
            List<Passenger> passengers = passengerRepository.findByBookingId(bookingId);

            try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
                Document doc = new Document(PageSize.A4, 50, 50, 60, 60);
                PdfWriter.getInstance(doc, baos);
                doc.open();

                addHeader(doc, agency, booking, bookingId);
                doc.add(spacer(12));
                addBookingDetails(doc, booking);
                doc.add(spacer(12));
                if (!passengers.isEmpty()) {
                    addPassengersTable(doc, passengers);
                    doc.add(spacer(12));
                }
                addPricingTable(doc, booking);
                doc.add(spacer(20));
                addFooter(doc, agency);

                doc.close();
                Files.write(pdfPath, baos.toByteArray());
            }
            return pdfPath.toString();

        } catch (Exception e) {
            throw new IllegalStateException("Failed to generate invoice for booking " + bookingId, e);
        }
    }

    public byte[] getInvoiceBytes(Long bookingId) {
        Path pdfPath = Path.of("files", "invoices", bookingId + ".pdf");
        try {
            if (!Files.exists(pdfPath)) {
                throw new IllegalStateException("Invoice not yet generated for booking " + bookingId);
            }
            return Files.readAllBytes(pdfPath);
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalStateException("Could not read invoice file", e);
        }
    }

    // ── Sections ──────────────────────────────────────────────────────────────

    private void addHeader(Document doc, Agency agency, Booking booking, Long bookingId)
            throws DocumentException {
        PdfPTable header = new PdfPTable(2);
        header.setWidthPercentage(100);
        header.setWidths(new float[]{3f, 2f});

        // Left: agency branding
        PdfPCell left = new PdfPCell();
        left.setBorder(Rectangle.NO_BORDER);
        left.setPaddingBottom(8);

        // Try logo
        if (agency != null && agency.getLogoPath() != null && !agency.getLogoPath().isBlank()) {
            try {
                Image logo = Image.getInstance(agency.getLogoPath());
                logo.scaleToFit(120, 50);
                left.addElement(logo);
                left.addElement(spacer(4));
            } catch (Exception ignored) { /* logo not loadable — skip */ }
        }

        String agencyName = agency != null ? agency.getName() : "Travel Agency";
        left.addElement(styledParagraph(agencyName, bold(16, PRIMARY), Element.ALIGN_LEFT));
        if (agency != null && agency.getSubscriptionPlan() != null) {
            left.addElement(styledParagraph(agency.getSubscriptionPlan(), normal(9, MID), Element.ALIGN_LEFT));
        }
        header.addCell(left);

        // Right: invoice meta
        PdfPCell right = new PdfPCell();
        right.setBorder(Rectangle.NO_BORDER);
        right.setHorizontalAlignment(Element.ALIGN_RIGHT);
        right.addElement(styledParagraph("INVOICE", bold(18, DARK), Element.ALIGN_RIGHT));
        right.addElement(styledParagraph("# " + String.format("%06d", bookingId), normal(10, MID), Element.ALIGN_RIGHT));
        right.addElement(styledParagraph("Date: " + DATE_FMT.format(
                booking.getCreatedAt() != null ? booking.getCreatedAt() : Instant.now()),
                normal(9, MID), Element.ALIGN_RIGHT));
        right.addElement(styledParagraph("Status: " + booking.getStatus().name(),
                bold(9, statusColor(booking.getStatus())), Element.ALIGN_RIGHT));
        header.addCell(right);

        // Divider
        PdfPTable divider = new PdfPTable(1);
        divider.setWidthPercentage(100);
        PdfPCell line = new PdfPCell(new Phrase(" "));
        line.setBackgroundColor(PRIMARY);
        line.setFixedHeight(3);
        line.setBorder(Rectangle.NO_BORDER);
        divider.addCell(line);

        doc.add(header);
        doc.add(divider);
    }

    private void addBookingDetails(Document doc, Booking booking) throws DocumentException {
        doc.add(sectionTitle("BOOKING DETAILS"));
        PdfPTable t = twoColTable();

        addDetailRow(t, "Booking Type",  capitalize(booking.getBookableType()));
        addDetailRow(t, "Reference ID",  "#" + booking.getBookableId());
        addDetailRow(t, "Currency",      booking.getCurrency() != null ? booking.getCurrency() : "PKR");
        doc.add(t);
    }

    private void addPassengersTable(Document doc, List<Passenger> passengers) throws DocumentException {
        doc.add(sectionTitle("PASSENGERS"));

        PdfPTable t = new PdfPTable(5);
        t.setWidthPercentage(100);
        t.setWidths(new float[]{0.5f, 2f, 1f, 1.5f, 1.5f});

        addTableHeader(t, "#", "Full Name", "Type", "Passport No.", "Nationality");

        int i = 1;
        for (Passenger p : passengers) {
            boolean shaded = (i % 2 == 0);
            addTableCell(t, String.valueOf(i++),            shaded);
            addTableCell(t, p.getFirstName() + " " + p.getLastName(), shaded);
            addTableCell(t, p.getType() != null ? p.getType().name() : "—", shaded);
            addTableCell(t, nvl(p.getPassportNo()), shaded);
            addTableCell(t, nvl(p.getNationality()), shaded);
        }
        doc.add(t);
    }

    private void addPricingTable(Document doc, Booking booking) throws DocumentException {
        doc.add(sectionTitle("PRICING BREAKDOWN"));

        PdfPTable t = new PdfPTable(2);
        t.setWidthPercentage(60);
        t.setHorizontalAlignment(Element.ALIGN_RIGHT);
        t.setWidths(new float[]{3f, 1.5f});

        Map<String, Object> snap = booking.getPricingSnapshot();
        String currency = booking.getCurrency() != null ? booking.getCurrency() : "PKR";

        if (snap != null) {
            int adults   = intFrom(snap, "adults");
            int children = intFrom(snap, "children");
            int infants  = intFrom(snap, "infants");

            if (adults   > 0) addPriceRow(t, "Adults   (" + adults   + " × " + fmt(snap, "fareAdult")  + ")", fmt(snap, "base"),   false, currency, false);
            if (children > 0) addPriceRow(t, "Children (" + children + " × " + fmt(snap, "fareChild")  + ")", fmtMul(snap, "fareChild",  children), false, currency, false);
            if (infants  > 0) addPriceRow(t, "Infants  (" + infants  + " × " + fmt(snap, "fareInfant") + ")", fmtMul(snap, "fareInfant", infants),  false, currency, false);

            addPriceRow(t, "Base Fare",    fmt(snap, "base"),      false, currency, false);
            addPriceRow(t, "Taxes",        fmt(snap, "taxes"),     false, currency, false);
            addPriceRow(t, "Fees",         fmt(snap, "fees"),      false, currency, false);
            addPriceRow(t, "Gross Total",  fmt(snap, "gross"),     true,  currency, false);
            addPriceRow(t, "Discounts",  "- " + fmt(snap, "discounts"), false, currency, false);
        }

        // Always show net total prominently
        addPriceRow(t, "NET TOTAL", money(booking.getNetTotal(), currency), true, currency, true);
        doc.add(t);
    }

    private void addFooter(Document doc, Agency agency) throws DocumentException {
        PdfPTable t = new PdfPTable(1);
        t.setWidthPercentage(100);
        PdfPCell cell = new PdfPCell();
        cell.setBackgroundColor(LIGHT_BG);
        cell.setBorderColor(BORDER);
        cell.setPadding(10);
        String agencyName = agency != null ? agency.getName() : "Travel Agency";
        cell.addElement(styledParagraph(
                "Thank you for choosing " + agencyName + ". This is a system-generated invoice.",
                normal(9, MID), Element.ALIGN_CENTER));
        t.addCell(cell);
        doc.add(t);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private PdfPTable twoColTable() throws DocumentException {
        PdfPTable t = new PdfPTable(2);
        t.setWidthPercentage(100);
        t.setWidths(new float[]{1.5f, 3f});
        return t;
    }

    private void addDetailRow(PdfPTable t, String label, String value) {
        PdfPCell lc = new PdfPCell(new Phrase(label, bold(9, DARK)));
        lc.setBorderColor(BORDER);
        lc.setPadding(6);
        lc.setBackgroundColor(LIGHT_BG);
        t.addCell(lc);

        PdfPCell vc = new PdfPCell(new Phrase(value, normal(9, DARK)));
        vc.setBorderColor(BORDER);
        vc.setPadding(6);
        t.addCell(vc);
    }

    private void addTableHeader(PdfPTable t, String... headers) {
        for (String h : headers) {
            PdfPCell c = new PdfPCell(new Phrase(h, bold(9, WHITE)));
            c.setBackgroundColor(PRIMARY);
            c.setBorderColor(PRIMARY);
            c.setPadding(6);
            t.addCell(c);
        }
    }

    private void addTableCell(PdfPTable t, String value, boolean shaded) {
        PdfPCell c = new PdfPCell(new Phrase(value, normal(9, DARK)));
        c.setBackgroundColor(shaded ? LIGHT_BG : WHITE);
        c.setBorderColor(BORDER);
        c.setPadding(5);
        t.addCell(c);
    }

    private void addPriceRow(PdfPTable t, String label, String value,
                              boolean bold, String currency, boolean highlight) {
        Color bg   = highlight ? PRIMARY  : WHITE;
        Color fg   = highlight ? WHITE    : DARK;
        Color lFg  = highlight ? WHITE    : MID;

        PdfPCell lc = new PdfPCell(new Phrase(label, bold ? bold(9, lFg) : normal(9, lFg)));
        lc.setBackgroundColor(bg);
        lc.setBorderColor(BORDER);
        lc.setPadding(6);
        t.addCell(lc);

        PdfPCell vc = new PdfPCell(new Phrase(value, bold ? bold(9, fg) : normal(9, fg)));
        vc.setBackgroundColor(bg);
        vc.setBorderColor(BORDER);
        vc.setPadding(6);
        vc.setHorizontalAlignment(Element.ALIGN_RIGHT);
        t.addCell(vc);
    }

    private Paragraph sectionTitle(String title) {
        Paragraph p = new Paragraph(title, bold(10, PRIMARY));
        p.setSpacingBefore(4);
        p.setSpacingAfter(6);
        return p;
    }

    private Paragraph styledParagraph(String text, Font font, int align) {
        Paragraph p = new Paragraph(text, font);
        p.setAlignment(align);
        return p;
    }

    private Chunk spacer(float height) {
        Paragraph p = new Paragraph(" ");
        p.setLeading(height);
        return new Chunk(" \n");
    }

    private Font bold(int size, Color color) {
        Font f = FontFactory.getFont(FontFactory.HELVETICA_BOLD, size);
        f.setColor(color);
        return f;
    }

    private Font normal(int size, Color color) {
        Font f = FontFactory.getFont(FontFactory.HELVETICA, size);
        f.setColor(color);
        return f;
    }

    private Color statusColor(BookingStatus status) {
        return switch (status) {
            case CONFIRMED  -> new Color(22, 163, 74);   // green-600
            case CANCELLED  -> new Color(220, 38, 38);   // red-600
            default         -> new Color(202, 138, 4);   // yellow-600
        };
    }

    private String capitalize(String s) {
        if (s == null || s.isBlank()) return "—";
        return Character.toUpperCase(s.charAt(0)) + s.substring(1).toLowerCase();
    }

    private String nvl(String s) {
        return (s == null || s.isBlank()) ? "—" : s;
    }

    private String money(BigDecimal v, String currency) {
        if (v == null) return currency + " 0.00";
        return currency + " " + String.format("%,.2f", v);
    }

    private String fmt(Map<String, Object> snap, String key) {
        Object v = snap.get(key);
        if (v == null) return "0.00";
        if (v instanceof BigDecimal bd) return String.format("%,.2f", bd);
        return v.toString();
    }

    private String fmtMul(Map<String, Object> snap, String key, int qty) {
        Object v = snap.get(key);
        if (v instanceof BigDecimal bd) return String.format("%,.2f", bd.multiply(BigDecimal.valueOf(qty)));
        return "0.00";
    }

    private int intFrom(Map<String, Object> snap, String key) {
        Object v = snap.get(key);
        if (v instanceof Number n) return n.intValue();
        return 0;
    }
}
