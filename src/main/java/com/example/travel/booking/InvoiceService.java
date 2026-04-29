package com.example.travel.booking;

import com.example.travel.agency.Agency;
import com.example.travel.agency.AgencyRepository;
import com.example.travel.flight.Flight;
import com.example.travel.flight.FlightLeg;
import com.example.travel.flight.FlightLegRepository;
import com.example.travel.flight.FlightRepository;
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
import java.io.InputStream;
import java.math.BigDecimal;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;

@Service
public class InvoiceService {

    private static final Color PRIMARY    = new Color(37, 99, 235);
    private static final Color DARK       = new Color(17, 24, 39);
    private static final Color MID        = new Color(107, 114, 128);
    private static final Color LIGHT_BG   = new Color(243, 244, 246);
    private static final Color WHITE      = Color.WHITE;
    private static final Color BORDER     = new Color(209, 213, 219);
    private static final Color GREEN      = new Color(22, 163, 74);
    private static final Color RED        = new Color(220, 38, 38);
    private static final Color AMBER      = new Color(202, 138, 4);
    private static final Color TICKET_HDR = new Color(30, 64, 175); // blue-800

    private static final DateTimeFormatter DT_FMT =
            DateTimeFormatter.ofPattern("dd MMM yyyy, HH:mm").withZone(ZoneId.systemDefault());
    private static final DateTimeFormatter DATE_FMT =
            DateTimeFormatter.ofPattern("dd MMM yyyy").withZone(ZoneId.systemDefault());

    private final AgencyRepository      agencyRepository;
    private final PassengerRepository   passengerRepository;
    private final FlightRepository      flightRepository;
    private final FlightLegRepository   flightLegRepository;

    public InvoiceService(AgencyRepository agencyRepository,
                          PassengerRepository passengerRepository,
                          FlightRepository flightRepository,
                          FlightLegRepository flightLegRepository) {
        this.agencyRepository    = agencyRepository;
        this.passengerRepository = passengerRepository;
        this.flightRepository    = flightRepository;
        this.flightLegRepository = flightLegRepository;
    }

    @Transactional(readOnly = true)
    public String generateInvoicePdf(Long bookingId, Booking booking) {
        try {
            Path dir = Path.of("files", "invoices");
            Files.createDirectories(dir);
            Path pdfPath = dir.resolve(bookingId + ".pdf");

            Agency         agency     = agencyRepository.findById(booking.getAgencyId()).orElse(null);
            List<Passenger> passengers = passengerRepository.findByBookingId(bookingId);

            try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
                Document doc = new Document(PageSize.A4, 40, 40, 50, 50);
                PdfWriter.getInstance(doc, baos);
                doc.open();

                if ("flight".equalsIgnoreCase(booking.getBookableType())) {
                    // JOIN FETCH ensures airline (and its logoUrl) is loaded in one query
                    Flight flight = booking.getBookableId() != null
                            ? flightRepository.findByIdWithAirline(booking.getBookableId()).orElse(null)
                            : null;
                    List<FlightLeg> legs = flight != null
                            ? flightLegRepository.findByFlightIdOrderByLegOrder(flight.getId())
                            : List.of();
                    generateETicket(doc, booking, agency, passengers, flight, legs);
                } else {
                    generateInvoice(doc, booking, agency, passengers, bookingId);
                }

                doc.close();
                Files.write(pdfPath, baos.toByteArray());
            }
            return pdfPath.toString();

        } catch (Exception e) {
            throw new IllegalStateException("Failed to generate invoice for booking " + bookingId, e);
        }
    }

    public byte[] getInvoiceBytes(Long bookingId) {
        Path pdfPath = Path.of("files", "invoices").resolve(bookingId + ".pdf");
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

    // ── E-Ticket Voucher ──────────────────────────────────────────────────────

    private void generateETicket(Document doc, Booking booking, Agency agency,
                                  List<Passenger> passengers, Flight flight,
                                  List<FlightLeg> legs) throws DocumentException {

        // ── Header ──
        addETicketHeader(doc, booking, agency, flight, legs);
        doc.add(gap(8));

        // ── Tagline ──
        Paragraph thanks = new Paragraph("Thank you for booking with us.", normal(10, MID));
        thanks.setAlignment(Element.ALIGN_CENTER);
        doc.add(thanks);
        doc.add(gap(10));

        // ── Passenger details ──
        addTicketPassengersTable(doc, passengers);
        doc.add(gap(10));

        // ── Per-leg flight sections ──
        for (FlightLeg leg : legs) {
            addLegSection(doc, leg, flight);
            doc.add(gap(6));
        }

        // ── Emergency Contact ──
        addEmergencyContact(doc, agency);
        doc.add(gap(10));

        // ── Rules ──
        addRules(doc);
    }

    private void addETicketHeader(Document doc, Booking booking, Agency agency,
                                   Flight flight, List<FlightLeg> legs)
            throws DocumentException {

        // 3-column header: [logo + name] | [title + status] | [departure + PNR + flight]
        PdfPTable top = new PdfPTable(3);
        top.setWidthPercentage(100);
        top.setWidths(new float[]{2f, 3f, 2f});

        // ── Left: airline logo + name ──
        PdfPCell leftCell = new PdfPCell();
        leftCell.setBorder(Rectangle.NO_BORDER);
        leftCell.setPadding(4);

        String airlineName = (flight != null && flight.getAirline() != null)
                ? flight.getAirline().getName()
                : (agency != null ? agency.getName() : "Travel Agency");

        if (flight != null && flight.getAirline() != null) {
            String logoUrl = flight.getAirline().getLogoUrl();
            Image img = loadImage(logoUrl);
            if (img != null) {
                img.scaleToFit(100, 45);
                // Wrap image in Chunk inside Paragraph — required for OpenPDF to render
                // images correctly inside PdfPCell composite mode
                Paragraph imgPara = new Paragraph();
                imgPara.add(new Chunk(img, 0, 0));
                leftCell.addElement(imgPara);
            }
        }
        leftCell.addElement(styledParagraph(airlineName, bold(9, DARK), Element.ALIGN_LEFT));
        top.addCell(leftCell);

        // ── Center: title + status ──
        PdfPCell centerCell = new PdfPCell();
        centerCell.setBorder(Rectangle.NO_BORDER);
        centerCell.setPadding(4);
        centerCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        centerCell.addElement(styledParagraph("E-Ticket Voucher", bold(16, TICKET_HDR), Element.ALIGN_CENTER));
        Color sc = statusColor(booking.getStatus());
        centerCell.addElement(styledParagraph(booking.getStatus().name(), bold(10, sc), Element.ALIGN_CENTER));
        top.addCell(centerCell);

        // ── Right: departure date + PNR + flight number ──
        PdfPCell rightCell = new PdfPCell();
        rightCell.setBorder(Rectangle.NO_BORDER);
        rightCell.setPadding(4);

        if (!legs.isEmpty() && legs.get(0).getDepartAt() != null) {
            rightCell.addElement(styledParagraph(
                    "Departure: " + DATE_FMT.format(legs.get(0).getDepartAt()),
                    normal(9, DARK), Element.ALIGN_RIGHT));
        }
        if (flight != null && flight.getPnrCode() != null && !flight.getPnrCode().isBlank()) {
            rightCell.addElement(styledParagraph("PNR: " + flight.getPnrCode(),
                    bold(11, PRIMARY), Element.ALIGN_RIGHT));
        }
        if (flight != null && flight.getFlightNumber() != null && !flight.getFlightNumber().isBlank()) {
            rightCell.addElement(styledParagraph("Flight: " + flight.getFlightNumber(),
                    normal(9, MID), Element.ALIGN_RIGHT));
        }
        top.addCell(rightCell);

        doc.add(top);

        // ── Blue divider line ──
        PdfPTable line = new PdfPTable(1);
        line.setWidthPercentage(100);
        PdfPCell lineCell = new PdfPCell(new Phrase(" "));
        lineCell.setBackgroundColor(PRIMARY);
        lineCell.setFixedHeight(3);
        lineCell.setBorder(Rectangle.NO_BORDER);
        line.addCell(lineCell);
        doc.add(line);
    }

    private void addTicketPassengersTable(Document doc, List<Passenger> passengers)
            throws DocumentException {
        doc.add(styledParagraph("Passenger Details", bold(10, TICKET_HDR), Element.ALIGN_LEFT));
        doc.add(gap(4));

        PdfPTable t = new PdfPTable(3);
        t.setWidthPercentage(100);
        t.setWidths(new float[]{3f, 2f, 1.5f});

        addTableHeader(t, "Passenger Name", "Passport No", "Status");
        for (Passenger p : passengers) {
            String name   = p.getFirstName() + " " + p.getLastName();
            String pport  = nvl(p.getPassportNo());
            String status = p.getType() != null ? p.getType().name() : "—";
            addTableCell(t, name,   false);
            addTableCell(t, pport,  false);
            addTableCell(t, status, false);
        }
        if (passengers.isEmpty()) {
            PdfPCell empty = new PdfPCell(new Phrase("—", normal(9, MID)));
            empty.setColspan(3);
            empty.setPadding(6);
            empty.setBorderColor(BORDER);
            t.addCell(empty);
        }
        doc.add(t);
    }

    private void addLegSection(Document doc, FlightLeg leg, Flight flight)
            throws DocumentException {

        String airlineCode = (flight != null && flight.getAirline() != null)
                ? flight.getAirline().getCode() : "—";
        String flightNo    = (flight != null && flight.getFlightNumber() != null)
                ? flight.getFlightNumber() : "—";

        // Section header: ✈ Departure from ORIGIN (Flight CODE:NUMBER)
        String header = "✈ Departure from " + leg.getOrigin()
                + " (Flight " + airlineCode + ":" + flightNo + ")";
        Paragraph hdr = new Paragraph(header, bold(10, WHITE));
        hdr.setAlignment(Element.ALIGN_LEFT);

        PdfPTable hdrTable = new PdfPTable(1);
        hdrTable.setWidthPercentage(100);
        PdfPCell hdrCell = new PdfPCell(hdr);
        hdrCell.setBackgroundColor(TICKET_HDR);
        hdrCell.setPadding(6);
        hdrCell.setBorder(Rectangle.NO_BORDER);
        hdrTable.addCell(hdrCell);
        doc.add(hdrTable);

        // 3-column detail: Departure | Arrival | Class / Baggage / Seat
        PdfPTable detail = new PdfPTable(3);
        detail.setWidthPercentage(100);
        detail.setWidths(new float[]{1f, 1f, 1f});

        // Column headers
        addTableHeader(detail, "Departure", "Arrival", "Baggage / Info");

        // Column values
        String depart  = leg.getDepartAt()  != null ? DT_FMT.format(leg.getDepartAt())  : "—";
        String arrive  = leg.getArriveAt()  != null ? DT_FMT.format(leg.getArriveAt())  : "—";
        String baggage = leg.getBaggageKg() != null ? leg.getBaggageKg() + " kg" : "—";
        if (flight != null && flight.getBaggageInfo() != null && !flight.getBaggageInfo().isBlank()) {
            baggage = baggage + " / " + flight.getBaggageInfo();
        }

        addTableCell(detail, depart,  false);
        addTableCell(detail, arrive,  false);
        addTableCell(detail, baggage, false);

        doc.add(detail);

        // From → To line
        Paragraph route = new Paragraph(leg.getOrigin() + "  →  " + leg.getDestination(),
                normal(9, MID));
        route.setSpacingBefore(3);
        doc.add(route);
    }

    private void addEmergencyContact(Document doc, Agency agency) throws DocumentException {
        PdfPTable t = new PdfPTable(1);
        t.setWidthPercentage(100);

        PdfPCell cell = new PdfPCell();
        cell.setBackgroundColor(LIGHT_BG);
        cell.setBorderColor(BORDER);
        cell.setPadding(10);

        cell.addElement(styledParagraph("Emergency Contact", bold(10, TICKET_HDR), Element.ALIGN_LEFT));
        cell.addElement(gap(4));

        String agencyName = agency != null ? agency.getName()     : "Travel Agency";
        String contactNo  = agency != null ? nvl(agency.getContactNo()) : "—";
        String address    = agency != null ? nvl(agency.getAddress())   : "—";

        cell.addElement(new Phrase("Agency: "     + agencyName, bold(9, DARK)));
        cell.addElement(gap(2));
        cell.addElement(new Phrase("Contact No: " + contactNo,  normal(9, DARK)));
        cell.addElement(gap(2));
        cell.addElement(new Phrase("Address: "    + address,    normal(9, DARK)));

        t.addCell(cell);
        doc.add(t);
    }

    private void addRules(Document doc) throws DocumentException {
        doc.add(styledParagraph("Important Information", bold(10, TICKET_HDR), Element.ALIGN_LEFT));
        doc.add(gap(4));

        String[] rules = {
            "Check-in at least 4 hours before departure for international flights.",
            "Reconfirm your flight 48 hours prior to departure.",
            "Passengers are responsible for obtaining valid visas and travel documents.",
            "Group bookings are non-refundable once confirmed.",
            "LLC fares are non-refundable and non-transferable."
        };
        for (String rule : rules) {
            Paragraph p = new Paragraph("•  " + rule, normal(9, DARK));
            p.setSpacingAfter(3);
            doc.add(p);
        }
    }

    // ── Package Voucher (non-flight bookings) ────────────────────────────────

    private void generateInvoice(Document doc, Booking booking, Agency agency,
                                  List<Passenger> passengers, Long bookingId)
            throws DocumentException {

        // ── Header (mirrors e-ticket layout) ──
        addVoucherHeader(doc, booking, agency, bookingId);
        doc.add(gap(8));

        // ── Tagline ──
        Paragraph thanks = new Paragraph("Thank you for booking with us.", normal(10, MID));
        thanks.setAlignment(Element.ALIGN_CENTER);
        doc.add(thanks);
        doc.add(gap(10));

        // ── Passengers ──
        addTicketPassengersTable(doc, passengers);
        doc.add(gap(10));

        // ── Package details section ──
        addPackageDetailsSection(doc, booking);
        doc.add(gap(10));

        // ── Emergency contact ──
        addEmergencyContact(doc, agency);
        doc.add(gap(10));

        // ── Rules ──
        addRules(doc);
    }

    private void addVoucherHeader(Document doc, Booking booking, Agency agency, Long bookingId)
            throws DocumentException {

        // 3-column: [agency logo + name] | [Package Voucher + status] | [booking ref + date + total]
        PdfPTable top = new PdfPTable(3);
        top.setWidthPercentage(100);
        top.setWidths(new float[]{2f, 3f, 2f});

        // ── Left: agency logo + name ──
        PdfPCell leftCell = new PdfPCell();
        leftCell.setBorder(Rectangle.NO_BORDER);
        leftCell.setPadding(4);

        String agencyName = agency != null ? agency.getName() : "Travel Agency";
        Image agencyLogo = loadImage(agency != null ? agency.getLogoPath() : null);
        if (agencyLogo != null) {
            agencyLogo.scaleToFit(100, 45);
            Paragraph imgPara = new Paragraph();
            imgPara.add(new Chunk(agencyLogo, 0, 0));
            leftCell.addElement(imgPara);
        }
        leftCell.addElement(styledParagraph(agencyName, bold(9, DARK), Element.ALIGN_LEFT));
        top.addCell(leftCell);

        // ── Center: title + package type + status ──
        PdfPCell centerCell = new PdfPCell();
        centerCell.setBorder(Rectangle.NO_BORDER);
        centerCell.setPadding(4);
        centerCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        centerCell.addElement(styledParagraph("Package Voucher", bold(16, TICKET_HDR), Element.ALIGN_CENTER));
        centerCell.addElement(styledParagraph(capitalize(booking.getBookableType()), normal(9, MID), Element.ALIGN_CENTER));
        Color sc = statusColor(booking.getStatus());
        centerCell.addElement(styledParagraph(booking.getStatus().name(), bold(10, sc), Element.ALIGN_CENTER));
        top.addCell(centerCell);

        // ── Right: booking ref + date + gross total ──
        PdfPCell rightCell = new PdfPCell();
        rightCell.setBorder(Rectangle.NO_BORDER);
        rightCell.setPadding(4);

        rightCell.addElement(styledParagraph(
                "Booking #" + String.format("%06d", bookingId),
                bold(11, PRIMARY), Element.ALIGN_RIGHT));

        if (booking.getCreatedAt() != null) {
            rightCell.addElement(styledParagraph(
                    "Date: " + DATE_FMT.format(booking.getCreatedAt()),
                    normal(9, DARK), Element.ALIGN_RIGHT));
        }

        String currency = booking.getCurrency() != null ? booking.getCurrency() : "PKR";
        if (booking.getGrossTotal() != null) {
            rightCell.addElement(styledParagraph(
                    "Total: " + money(booking.getGrossTotal(), currency),
                    bold(9, DARK), Element.ALIGN_RIGHT));
        }
        top.addCell(rightCell);

        doc.add(top);

        // ── Blue divider line ──
        PdfPTable line = new PdfPTable(1);
        line.setWidthPercentage(100);
        PdfPCell lineCell = new PdfPCell(new Phrase(" "));
        lineCell.setBackgroundColor(PRIMARY);
        lineCell.setFixedHeight(3);
        lineCell.setBorder(Rectangle.NO_BORDER);
        line.addCell(lineCell);
        doc.add(line);
    }

    private void addPackageDetailsSection(Document doc, Booking booking) throws DocumentException {

        // Section header bar (same style as flight leg header)
        String pkgType = capitalize(booking.getBookableType()) + " Package";
        Paragraph hdr = new Paragraph("📦  " + pkgType + " Details", bold(10, WHITE));
        hdr.setAlignment(Element.ALIGN_LEFT);

        PdfPTable hdrTable = new PdfPTable(1);
        hdrTable.setWidthPercentage(100);
        PdfPCell hdrCell = new PdfPCell(hdr);
        hdrCell.setBackgroundColor(TICKET_HDR);
        hdrCell.setPadding(6);
        hdrCell.setBorder(Rectangle.NO_BORDER);
        hdrTable.addCell(hdrCell);
        doc.add(hdrTable);

        // Detail grid
        PdfPTable detail = new PdfPTable(3);
        detail.setWidthPercentage(100);
        detail.setWidths(new float[]{1f, 1f, 1f});

        addTableHeader(detail, "Package Type", "Reference ID", "Currency");

        String currency = booking.getCurrency() != null ? booking.getCurrency() : "PKR";
        addTableCell(detail, capitalize(booking.getBookableType()), false);
        addTableCell(detail, "#" + booking.getBookableId(), false);
        addTableCell(detail, currency, false);

        doc.add(detail);

        // Pricing snapshot extras (adults/children/infants counts)
        Map<String, Object> snap = booking.getPricingSnapshot();
        if (snap != null) {
            int adults   = intFrom(snap, "adults");
            int children = intFrom(snap, "children");
            int infants  = intFrom(snap, "infants");
            if (adults > 0 || children > 0 || infants > 0) {
                PdfPTable paxTable = new PdfPTable(3);
                paxTable.setWidthPercentage(100);
                paxTable.setWidths(new float[]{1f, 1f, 1f});
                addTableHeader(paxTable, "Adults", "Children", "Infants");
                addTableCell(paxTable, String.valueOf(adults),   true);
                addTableCell(paxTable, String.valueOf(children), true);
                addTableCell(paxTable, String.valueOf(infants),  true);
                doc.add(paxTable);
            }
        }
    }

    // ── Shared helpers ────────────────────────────────────────────────────────

    private void addTableHeader(PdfPTable t, String... headers) {
        for (String h : headers) {
            PdfPCell c = new PdfPCell(new Phrase(h, bold(9, WHITE)));
            c.setBackgroundColor(PRIMARY); c.setBorderColor(PRIMARY); c.setPadding(6);
            t.addCell(c);
        }
    }

    private void addTableCell(PdfPTable t, String value, boolean shaded) {
        PdfPCell c = new PdfPCell(new Phrase(value, normal(9, DARK)));
        c.setBackgroundColor(shaded ? LIGHT_BG : WHITE);
        c.setBorderColor(BORDER); c.setPadding(5);
        t.addCell(c);
    }

    private void addPriceRow(PdfPTable t, String label, String value,
                              boolean isBold, String currency, boolean highlight) {
        Color bg  = highlight ? PRIMARY : WHITE;
        Color fg  = highlight ? WHITE   : DARK;
        Color lFg = highlight ? WHITE   : MID;
        PdfPCell lc = new PdfPCell(new Phrase(label, isBold ? bold(9, lFg) : normal(9, lFg)));
        lc.setBackgroundColor(bg); lc.setBorderColor(BORDER); lc.setPadding(6);
        t.addCell(lc);
        PdfPCell vc = new PdfPCell(new Phrase(value, isBold ? bold(9, fg) : normal(9, fg)));
        vc.setBackgroundColor(bg); vc.setBorderColor(BORDER); vc.setPadding(6);
        vc.setHorizontalAlignment(Element.ALIGN_RIGHT);
        t.addCell(vc);
    }

    private Paragraph sectionTitle(String title) {
        Paragraph p = new Paragraph(title, bold(10, PRIMARY));
        p.setSpacingBefore(4); p.setSpacingAfter(6);
        return p;
    }

    private Paragraph styledParagraph(String text, Font font, int align) {
        Paragraph p = new Paragraph(text, font);
        p.setAlignment(align);
        return p;
    }

    private Chunk gap(float height) {
        return new Chunk("\n");
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
            case CONFIRMED -> GREEN;
            case CANCELLED -> RED;
            default        -> AMBER;
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

    /**
     * Downloads an image from a URL (or loads from file path) and returns an iText Image.
     * Uses HttpURLConnection with timeout and User-Agent to handle CDN-hosted logos reliably.
     * Returns null if the URL is blank or cannot be loaded.
     */
    private Image loadImage(String urlOrPath) {
        if (urlOrPath == null || urlOrPath.isBlank()) return null;
        try {
            if (urlOrPath.startsWith("http://") || urlOrPath.startsWith("https://")) {
                HttpURLConnection conn = (HttpURLConnection) new URL(urlOrPath).openConnection();
                conn.setConnectTimeout(6000);
                conn.setReadTimeout(6000);
                conn.setInstanceFollowRedirects(true);
                conn.setRequestProperty("User-Agent", "Mozilla/5.0");
                try (InputStream in = conn.getInputStream()) {
                    byte[] bytes = in.readAllBytes();
                    return Image.getInstance(bytes);
                }
            } else {
                // Local file path fallback
                return Image.getInstance(urlOrPath);
            }
        } catch (Exception e) {
            return null;
        }
    }
}
