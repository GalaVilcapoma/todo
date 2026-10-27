/**
 * Utilidades de formato.
 *
 * Nota sobre fechas: el backend devuelve `LocalDate` como "yyyy-MM-dd" (sin
 * zona) y `LocalDateTime` como ISO-8601 con offset. `new Date("2026-10-01")`
 * interpreta la cadena como UTC medianoche, así que en zonas con offset
 * negativo el día local retrocede una unidad (30/09 en lugar de 01/10). Por eso
 * las fechas "solo día" se parten por cadena y las de fecha+hora se ajustan al
 * huso local antes de mostrarse.
 */

const EMPTY = '—';

const pad = (value: number) => String(value).padStart(2, '0');

/** Extrae la parte "yyyy-MM-dd" sin pasar por el parser de Date. */
const dateParts = (value: string): { y: number; m: number; d: number } | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  if (!match) return null;
  const [, y, m, d] = match;
  return { y: Number(y), m: Number(m), d: Number(d) };
};

/** Convierte a un Date local, interpretando fechas sin hora como día local. */
const toLocalDate = (value: string): Date | null => {
  const parts = dateParts(value);
  // Sin componente de hora: construimos la fecha en hora local para evitar el
  // corrimiento de un día que produce el parseo UTC.
  if (parts) return new Date(parts.y, parts.m - 1, parts.d);
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

/** DD/MM/YYYY. */
export function formatDate(value?: string | null): string {
  if (!value) return EMPTY;
  const date = toLocalDate(value);
  if (!date) return EMPTY;
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

/** DD/MM/YYYY HH:mm. */
export function formatDateTime(value?: string | null): string {
  if (!value) return EMPTY;
  const date = toLocalDate(value);
  if (!date) return EMPTY;
  return `${formatDate(value)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** "hace 3 días", "en 2 semanas". Devuelve null si la fecha no es válida. */
export function formatRelative(value?: string | null): string | null {
  if (!value) return null;
  const date = toLocalDate(value);
  if (!date) return null;

  const diffMs = date.getTime() - Date.now();
  const days = Math.round(diffMs / 86_400_000);
  if (days === 0) return 'hoy';

  const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });
  if (Math.abs(days) < 31) return rtf.format(days, 'day');
  const months = Math.round(days / 30);
  if (Math.abs(months) < 12) return rtf.format(months, 'month');
  return rtf.format(Math.round(days / 365), 'year');
}

/** Días que faltan para que expire la fecha; negativo si ya venció. */
export function daysUntil(value?: string | null): number | null {
  if (!value) return null;
  const date = toLocalDate(value);
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((date.getTime() - today.getTime()) / 86_400_000);
}

/** S/ 1,234.50 — moneda peruana. */
export function formatCurrency(value?: number | null): string {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) return 'S/ 0.00';
  return `S/ ${amount.toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** 1,234.50 — sin símbolo de moneda. */
export function formatNumber(value?: number | null, decimals = 2): string {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) return '0';
  return amount.toLocaleString('es-PE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Normaliza un número de BigDecimal que llega como JSON number.
 * Devuelve null cuando el valor no es utilizable, para que la UI pueda
 * distinguir "0" de "no informado".
 */
export function toNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/** Estado local en "yyyy-MM-dd" para <TextInput> y payloads. */
export function todayISO(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/**
 * Convierte un texto de formulario a número. Devuelve null si está vacío o no
 * es numérico, para no convertir campos opcionales en 0 sin querer.
 */
export function parseNumberField(raw: string): number | null {
  const normalized = raw.trim().replace(',', '.');
  if (normalized === '') return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Igual que parseNumberField pero con 0 como valor por defecto. */
export function parseNumberOrZero(raw: string): number {
  return parseNumberField(raw) ?? 0;
}

/** Igual que parseNumberField pero redondeado a entero. */
export function parseIntOrZero(raw: string): number {
  const parsed = parseNumberField(raw);
  return parsed === null ? 0 : Math.round(parsed);
}

/** Trim; convierte string vacío en null (para no mandar "" al backend). */
export function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}