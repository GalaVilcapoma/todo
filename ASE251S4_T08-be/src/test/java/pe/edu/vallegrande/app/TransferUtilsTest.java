package pe.edu.vallegrande.app;

import org.junit.jupiter.api.Test;
import pe.edu.vallegrande.app.util.CsvUtils;
import pe.edu.vallegrande.app.util.ExcelUtils;
import pe.edu.vallegrande.app.util.PdfUtils;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Verifica el round-trip (escribir → leer) de las utilidades de importación/exportación
 * sin necesidad de MongoDB ni del contexto de Spring.
 */
class TransferUtilsTest {

    private static final List<String> HEADERS = List.of("id", "name", "category", "price");

    private static final List<List<String>> ROWS = List.of(
            List.of("", "Fertilizante Folia-X", "Fertilizantes", "45.50"),
            List.of("", "Fungicida, Cupro-Z", "Fungicidas", "78.00"));

    @Test
    void csvRoundTripKeepsValuesAndAddsBom() {
        byte[] csv = CsvUtils.write(HEADERS, ROWS);

        assertTrue(csv.length > 3);
        assertEquals((byte) 0xEF, csv[0]);

        List<Map<String, String>> parsed = CsvUtils.read(csv);
        assertEquals(2, parsed.size());
        assertEquals("Fertilizante Folia-X", parsed.get(0).get("name"));
        assertEquals("Fungicida, Cupro-Z", parsed.get(1).get("name"));
        assertEquals("78.00", parsed.get(1).get("price"));
    }

    @Test
    void excelRoundTripKeepsValues() {
        byte[] xlsx = ExcelUtils.write("products", HEADERS, ROWS);

        assertTrue(xlsx.length > 0);

        List<Map<String, String>> parsed = ExcelUtils.read(xlsx);
        assertEquals(2, parsed.size());
        assertEquals("Fertilizantes", parsed.get(0).get("category"));
        assertEquals("Fungicida, Cupro-Z", parsed.get(1).get("name"));
    }

    @Test
    void pdfIsGeneratedWithHeader() {
        byte[] pdf = PdfUtils.write("Reporte de Productos", "products", HEADERS, ROWS);

        assertTrue(pdf.length > 500);
        assertEquals("%PDF", new String(pdf, 0, 4, StandardCharsets.US_ASCII));
    }
}
