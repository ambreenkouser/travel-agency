package com.example.travel.booking;

import com.itextpdf.text.Document;
import com.itextpdf.text.Paragraph;
import com.itextpdf.text.pdf.PdfWriter;
import java.io.ByteArrayOutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import org.springframework.stereotype.Service;

@Service
public class InvoiceService {

    public String generateInvoicePdf(Long bookingId, Booking booking) {
        try {
            Path dir = Path.of("files", "invoices");
            Files.createDirectories(dir);
            Path pdfPath = dir.resolve(bookingId + ".pdf");

            try (ByteArrayOutputStream baos = new ByteArrayOutputStream();
                 Document document = new Document()) {
                PdfWriter.getInstance(document, baos);
                document.open();
                document.add(new Paragraph("Invoice #" + bookingId));
                document.add(new Paragraph("Agency: " + booking.getAgencyId()));
                document.add(new Paragraph("Bookable: " + booking.getBookableType() + " #" + booking.getBookableId()));
                document.add(new Paragraph("Status: " + booking.getStatus()));
                document.add(new Paragraph("Net Total: " + booking.getNetTotal() + " " + booking.getCurrency()));
                document.add(new Paragraph("Tax: " + booking.getTaxTotal()));
                document.close();
                Files.write(pdfPath, baos.toByteArray());
            }
            return pdfPath.toString();
        } catch (Exception e) {
            throw new IllegalStateException("Failed to generate invoice", e);
        }
    }
}
