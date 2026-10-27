/**
 * Formatea una fecha ISO o Timestamp a formato legible local (DD/MM/YYYY)
 */
export const formatDate = (dateString?: string | Date | null): string => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return new Intl.DateTimeFormat('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  } catch {
    return 'N/A';
  }
};

/**
 * Formatea fecha y hora (DD/MM/YYYY HH:mm)
 */
export const formatDateTime = (dateString?: string | Date | null): string => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return new Intl.DateTimeFormat('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return 'N/A';
  }
};

/**
 * Formatea valores numéricos a formato de moneda (PEN / S/)
 */
export const formatCurrency = (amount?: number | null): string => {
  if (amount === undefined || amount === null) return 'S/ 0.00';
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
  }).format(amount);
};
