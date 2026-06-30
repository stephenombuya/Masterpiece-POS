package com.pos.service;

import com.itextpdf.text.*;
import com.itextpdf.text.pdf.PdfPCell;
import com.itextpdf.text.pdf.PdfPTable;
import com.itextpdf.text.pdf.PdfWriter;
import com.pos.config.AppProperties;
import com.pos.entity.Sale;
import com.pos.entity.SaleItem;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class ReceiptService {

    private static final Logger log = LoggerFactory.getLogger(ReceiptService.class);
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("dd MMM yyyy HH:mm:ss");

    private final AppProperties appProperties;

    public String generateReceipt(Sale sale) {
        String dir = appProperties.getReceipts().getDir();
        new File(dir).mkdirs();
        String filename = dir + File.separator + sale.getSaleNumber() + ".pdf";

        try {
            Document doc = new Document(PageSize.A6);
            PdfWriter.getInstance(doc, new FileOutputStream(filename));
            doc.open();

            Font titleFont  = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14);
            Font boldFont   = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9);
            Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 8);
            Font smallFont  = FontFactory.getFont(FontFactory.HELVETICA, 7);

            Paragraph title = new Paragraph(appProperties.getStore().getName(), titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            doc.add(title);

            Paragraph addr = new Paragraph(appProperties.getStore().getAddress(), smallFont);
            addr.setAlignment(Element.ALIGN_CENTER);
            doc.add(addr);

            doc.add(new Paragraph(" "));
            addLine(doc, "Receipt No:", sale.getSaleNumber(), boldFont, normalFont);
            String dateStr = sale.getCreatedAt() != null
                    ? sale.getCreatedAt().atZone(ZoneId.of("Africa/Nairobi")).format(FMT)
                    : "-";
            addLine(doc, "Date:", dateStr, boldFont, normalFont);
            addLine(doc, "Cashier:", sale.getCashier().getFullName(), boldFont, normalFont);

            doc.add(new Paragraph("------------------------------------------------", smallFont));

            PdfPTable table = new PdfPTable(new float[]{4, 1, 1.5f, 1.5f});
            table.setWidthPercentage(100);
            addTableHeader(table, boldFont, "Item", "Qty", "Price", "Total");
            for (SaleItem item : sale.getItems()) {
                addTableRow(table, normalFont,
                        item.getProductName(),
                        String.valueOf(item.getQuantity()),
                        String.format("%.2f", item.getUnitPrice()),
                        String.format("%.2f", item.getLineTotal()));
            }
            doc.add(table);

            doc.add(new Paragraph("------------------------------------------------", smallFont));

            addLine(doc, "Subtotal:", String.format("KES %.2f", sale.getSubtotal()), boldFont, normalFont);
            addLine(doc, "Tax (VAT):", String.format("KES %.2f", sale.getTaxAmount()), boldFont, normalFont);
            if (sale.getDiscount() != null && sale.getDiscount().signum() > 0) {
                addLine(doc, "Discount:", String.format("-KES %.2f", sale.getDiscount()), boldFont, normalFont);
            }

            Paragraph totalPara = new Paragraph(
                    String.format("TOTAL:   KES %.2f", sale.getTotalAmount()),
                    FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11));
            totalPara.setAlignment(Element.ALIGN_RIGHT);
            doc.add(totalPara);

            doc.add(new Paragraph(" "));
            Paragraph footer = new Paragraph("Thank you for shopping with us!", smallFont);
            footer.setAlignment(Element.ALIGN_CENTER);
            doc.add(footer);

            doc.close();
            log.info("Receipt generated: {}", filename);
        } catch (DocumentException | IOException e) {
            log.error("Receipt generation failed for sale {}: {}", sale.getSaleNumber(), e.getMessage());
        }
        return filename;
    }

    private void addLine(Document doc, String label, String value, Font labelFont, Font valueFont) throws DocumentException {
        Phrase line = new Phrase();
        line.add(new Chunk(label + " ", labelFont));
        line.add(new Chunk(value, valueFont));
        doc.add(new Paragraph(line));
    }

    private void addTableHeader(PdfPTable table, Font font, String... headers) {
        for (String h : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(h, font));
            cell.setBorder(Rectangle.BOTTOM);
            cell.setPadding(2);
            table.addCell(cell);
        }
    }

    private void addTableRow(PdfPTable table, Font font, String... values) {
        for (String v : values) {
            PdfPCell cell = new PdfPCell(new Phrase(v, font));
            cell.setBorder(Rectangle.NO_BORDER);
            cell.setPadding(2);
            table.addCell(cell);
        }
    }
}
