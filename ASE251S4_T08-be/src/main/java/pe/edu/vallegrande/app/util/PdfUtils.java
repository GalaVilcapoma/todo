package pe.edu.vallegrande.app.util;

import com.itextpdf.io.font.constants.StandardFonts;
import com.itextpdf.kernel.colors.Color;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.events.Event;
import com.itextpdf.kernel.events.IEventHandler;
import com.itextpdf.kernel.events.PdfDocumentEvent;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfPage;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.kernel.pdf.canvas.PdfCanvas;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.itextpdf.layout.properties.VerticalAlignment;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Genera reportes PDF en formato tabular con encabezado y pie de página usando iText 7.
 */
public final class PdfUtils {

    private static final Color TITLE_COLOR = new DeviceRgb(31, 78, 121);
    private static final Color HEADER_BACKGROUND = new DeviceRgb(31, 78, 121);
    private static final Color ALT_ROW_BACKGROUND = new DeviceRgb(240, 244, 248);
    private static final SolidBorder CELL_BORDER = new SolidBorder(new DeviceRgb(205, 210, 215), 0.5f);
    private static final DateTimeFormatter TIMESTAMP = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private PdfUtils() {
    }

    public static byte[] write(String title, String entityName, List<String> headers, List<List<String>> rows) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try {
            PdfFont bold = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);
            PdfFont regular = PdfFontFactory.createFont(StandardFonts.HELVETICA);

            PdfDocument pdf = new PdfDocument(new PdfWriter(out));
            Document document = new Document(pdf, PageSize.A4.rotate());
            document.setMargins(36, 36, 48, 36);

            document.add(new Paragraph(title).setFont(bold).setFontSize(16).setFontColor(TITLE_COLOR));
            document.add(new Paragraph("Entidad: " + entityName
                    + "    Registros: " + rows.size()
                    + "    Generado: " + LocalDateTime.now().format(TIMESTAMP))
                    .setFont(regular).setFontSize(9).setFontColor(ColorConstants.GRAY));
            document.add(new Paragraph(" ").setFont(regular).setFontSize(4));

            Table table = new Table(UnitValue.createPercentArray(headers.size())).useAllAvailableWidth();
            for (String header : headers) {
                table.addHeaderCell(headerCell(header, bold));
            }
            for (int r = 0; r < rows.size(); r++) {
                List<String> row = rows.get(r);
                for (int c = 0; c < headers.size(); c++) {
                    String value = c < row.size() && row.get(c) != null ? row.get(c) : "";
                    table.addCell(bodyCell(value, regular, r % 2 == 1));
                }
            }
            document.add(table);

            addFooter(pdf, regular);
            document.close();
            return out.toByteArray();
        } catch (IOException e) {
            throw new UncheckedIOException("No se pudo generar el archivo PDF.", e);
        }
    }

    private static Cell headerCell(String text, PdfFont font) {
        Cell cell = new Cell()
                .add(new Paragraph(text).setFont(font).setFontSize(9).setFontColor(ColorConstants.WHITE))
                .setBackgroundColor(HEADER_BACKGROUND)
                .setTextAlignment(TextAlignment.CENTER)
                .setVerticalAlignment(VerticalAlignment.MIDDLE)
                .setPadding(5);
        cell.setBorder(CELL_BORDER);
        return cell;
    }

    private static Cell bodyCell(String text, PdfFont font, boolean alternate) {
        Cell cell = new Cell()
                .add(new Paragraph(text).setFont(font).setFontSize(8))
                .setVerticalAlignment(VerticalAlignment.MIDDLE)
                .setPadding(4);
        cell.setBorder(CELL_BORDER);
        if (alternate) {
            cell.setBackgroundColor(ALT_ROW_BACKGROUND);
        }
        return cell;
    }

    private static void addFooter(PdfDocument pdf, PdfFont font) {
        pdf.addEventHandler(PdfDocumentEvent.END_PAGE, new IEventHandler() {
            @Override
            public void handleEvent(Event event) {
                PdfDocumentEvent documentEvent = (PdfDocumentEvent) event;
                PdfDocument document = documentEvent.getDocument();
                PdfPage page = documentEvent.getPage();
                new PdfCanvas(page.newContentStreamAfter(), page.getResources(), document)
                        .beginText()
                        .setFontAndSize(font, 8)
                        .moveText(36, 20)
                        .showText("Página " + document.getPageNumber(page) + " de " + document.getNumberOfPages())
                        .endText()
                        .release();
            }
        });
    }
}
