package pe.edu.vallegrande.app.util;

import org.apache.poi.ss.usermodel.BorderStyle;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.DateUtil;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Lee y escribe archivos Excel (.xlsx) usando Apache POI.
 *
 * <p>El ancho de las columnas se calcula a mano en lugar de usar
 * {@code autoSizeColumn} porque esa API depende de AWT, que no está disponible
 * en algunos entornos headless (contenedores).
 */
public final class ExcelUtils {

    private static final int MAX_COLUMN_WIDTH = 40;

    private ExcelUtils() {
    }

    public static byte[] write(String sheetName, List<String> headers, List<List<String>> rows) {
        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet(sheetName);
            CellStyle headerStyle = headerStyle(workbook);

            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.size(); i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers.get(i));
                cell.setCellStyle(headerStyle);
            }

            int width[] = new int[headers.size()];
            for (int i = 0; i < headers.size(); i++) {
                width[i] = headers.get(i).length();
            }

            int rowIndex = 1;
            for (List<String> values : rows) {
                Row row = sheet.createRow(rowIndex++);
                for (int i = 0; i < headers.size(); i++) {
                    String value = i < values.size() && values.get(i) != null ? values.get(i) : "";
                    Cell cell = row.createCell(i);
                    cell.setCellValue(value);
                    width[i] = Math.max(width[i], value.length());
                }
            }

            for (int i = 0; i < headers.size(); i++) {
                sheet.setColumnWidth(i, columnWidth(width[i]));
            }
            sheet.createFreezePane(0, 1);

            workbook.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new UncheckedIOException("No se pudo generar el archivo Excel.", e);
        }
    }

    /**
     * @return una fila por mapa (cabecera → valor). Las filas totalmente vacías
     *         se descartan y los nombres de cabecera se normalizan.
     */
    public static List<Map<String, String>> read(byte[] content) {
        if (content == null || content.length == 0) {
            throw new IllegalArgumentException("El archivo Excel está vacío.");
        }
        DataFormatter formatter = new DataFormatter();
        List<Map<String, String>> result = new ArrayList<>();
        try (Workbook workbook = WorkbookFactory.create(new ByteArrayInputStream(content))) {
            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> iterator = sheet.iterator();
            if (!iterator.hasNext()) {
                return result;
            }
            Row headerRow = iterator.next();
            List<String> headers = new ArrayList<>();
            for (int i = 0; i < headerRow.getLastCellNum(); i++) {
                headers.add(readCell(headerRow.getCell(i), formatter).trim());
            }
            while (iterator.hasNext()) {
                Row row = iterator.next();
                Map<String, String> values = new LinkedHashMap<>();
                boolean hasData = false;
                for (int i = 0; i < headers.size(); i++) {
                    if (headers.get(i).isEmpty()) {
                        continue;
                    }
                    String value = readCell(row.getCell(i), formatter);
                    if (!value.isBlank()) {
                        hasData = true;
                    }
                    values.put(headers.get(i), value);
                }
                if (hasData) {
                    result.add(values);
                }
            }
            return result;
        } catch (IOException e) {
            throw new IllegalArgumentException("No se pudo leer el archivo Excel. Verifique que sea un .xlsx válido.", e);
        } catch (RuntimeException e) {
            throw new IllegalArgumentException("No se pudo leer el archivo Excel. Verifique que sea un .xlsx válido.", e);
        }
    }

    private static String readCell(Cell cell, DataFormatter formatter) {
        if (cell == null) {
            return "";
        }
        if (cell.getCellType() == org.apache.poi.ss.usermodel.CellType.NUMERIC && DateUtil.isCellDateFormatted(cell)) {
            return cell.getLocalDateTimeCellValue().toLocalDate().toString();
        }
        return formatter.formatCellValue(cell).trim();
    }

    private static int columnWidth(int longestValue) {
        int characters = Math.min(Math.max(longestValue + 4, 12), MAX_COLUMN_WIDTH);
        return characters * 256;
    }

    private static CellStyle headerStyle(Workbook workbook) {
        Font font = workbook.createFont();
        font.setBold(true);
        font.setColor(IndexedColors.WHITE.getIndex());

        CellStyle style = workbook.createCellStyle();
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }
}
