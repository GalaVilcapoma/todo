package pe.edu.vallegrande.app.util;

import com.opencsv.CSVReader;
import com.opencsv.CSVReaderBuilder;
import com.opencsv.CSVWriter;
import com.opencsv.exceptions.CsvException;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.StringReader;
import java.io.StringWriter;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Lee y escribe archivos CSV usando OpenCSV.
 *
 * <p>La exportación antepone un BOM UTF-8 para que Excel muestre correctamente
 * los acentos al abrir el archivo con doble clic.
 */
public final class CsvUtils {

    private static final byte[] UTF8_BOM = {(byte) 0xEF, (byte) 0xBB, (byte) 0xBF};

    private CsvUtils() {
    }

    public static byte[] write(List<String> headers, List<List<String>> rows) {
        try (StringWriter buffer = new StringWriter();
             CSVWriter writer = new CSVWriter(buffer)) {

            writer.writeNext(headers.toArray(new String[0]), false);
            for (List<String> row : rows) {
                String[] values = new String[headers.size()];
                for (int i = 0; i < headers.size(); i++) {
                    values[i] = i < row.size() && row.get(i) != null ? row.get(i) : "";
                }
                writer.writeNext(values, false);
            }
            writer.flush();

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            out.write(UTF8_BOM);
            out.write(buffer.toString().getBytes(StandardCharsets.UTF_8));
            return out.toByteArray();
        } catch (IOException e) {
            throw new UncheckedIOException("No se pudo generar el archivo CSV.", e);
        }
    }

    public static List<Map<String, String>> read(byte[] content) {
        if (content == null || content.length == 0) {
            throw new IllegalArgumentException("El archivo CSV está vacío.");
        }
        String text = new String(content, StandardCharsets.UTF_8);
        if (!text.isEmpty() && text.charAt(0) == '\uFEFF') {
            text = text.substring(1);
        }
        List<Map<String, String>> result = new ArrayList<>();
        try (CSVReader reader = new CSVReaderBuilder(new StringReader(text)).build()) {
            List<String[]> allRows = reader.readAll();
            if (allRows.isEmpty()) {
                return result;
            }
            List<String> headers = new ArrayList<>();
            for (String header : allRows.get(0)) {
                headers.add(header == null ? "" : header.trim());
            }
            for (int i = 1; i < allRows.size(); i++) {
                String[] cells = allRows.get(i);
                Map<String, String> values = new LinkedHashMap<>();
                boolean hasData = false;
                for (int c = 0; c < headers.size(); c++) {
                    if (headers.get(c).isEmpty()) {
                        continue;
                    }
                    String value = c < cells.length && cells[c] != null ? cells[c].trim() : "";
                    if (!value.isBlank()) {
                        hasData = true;
                    }
                    values.put(headers.get(c), value);
                }
                if (hasData) {
                    result.add(values);
                }
            }
            return result;
        } catch (IOException e) {
            throw new IllegalArgumentException("No se pudo leer el archivo CSV.", e);
        } catch (CsvException e) {
            throw new IllegalArgumentException("No se pudo leer el archivo CSV: " + e.getMessage(), e);
        }
    }
}
