/**
 * Utilidades de validación para formularios del Frontend (AVSA)
 */

export const REGEX_EMAIL = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export const REGEX_PHONE_PE = /^9\d{8}$/;
export const REGEX_DNI = /^\d{8}$/;
export const REGEX_RUC = /^(10|20)\d{9}$/;

export interface ProductoValidatorData {
  name?: string;
  category?: string;
  code?: string;
  unitPrice: string | number;
  currentStock: string | number;
  minimumStock: string | number;
  origin?: string;
}

export interface ClientValidatorData {
  businessName?: string;
  documentNumber?: string;
  phone?: string;
  email?: string;
}

export interface AgrochemicalValidatorData {
  commercialName?: string;
  activeIngredient?: string;
  maxDose?: string | number;
  waitingPeriodDays?: string | number;
}

export interface ApplicationValidatorData {
  fieldSector?: string;
  cropType?: string;
  appliedAreaHectares: string | number;
  dosePerHectare: string | number;
}

export const validateProducto = (data: ProductoValidatorData): string | null => {
  if (!data.name || !data.name.trim()) {
    return 'El nombre del producto es obligatorio';
  }
  if (data.name.trim().length < 3) {
    return 'El nombre del producto debe tener al menos 3 caracteres';
  }

  if (!data.category || !data.category.trim()) {
    return 'La categoría es obligatoria';
  }

  if (data.code && data.code.trim().length < 3) {
    return 'El código ingresado debe tener al menos 3 caracteres';
  }

  const price = Number.parseFloat(String(data.unitPrice));
  if (data.unitPrice === '' || Number.isNaN(price)) {
    return 'El precio unitario es obligatorio y debe ser numérico';
  }
  if (price <= 0) {
    return 'El precio unitario debe ser mayor a S/ 0.00';
  }

  const stock = Number.parseInt(String(data.currentStock), 10);
  if (data.currentStock !== '' && (Number.isNaN(stock) || stock < 0)) {
    return 'El stock actual no puede ser un valor negativo';
  }

  const minStock = Number.parseInt(String(data.minimumStock), 10);
  if (data.minimumStock !== '' && (Number.isNaN(minStock) || minStock < 0)) {
    return 'El stock mínimo no puede ser un valor negativo';
  }

  if (!data.origin || !data.origin.trim()) {
    return 'El origen del producto es obligatorio (Nacional o Importado)';
  }

  return null;
};

export const validateClient = (data: ClientValidatorData): string | null => {
  if (!data.businessName || !data.businessName.trim()) {
    return 'La razón social o nombre completo es obligatorio';
  }
  if (data.businessName.trim().length < 3) {
    return 'La razón social o nombre debe tener al menos 3 caracteres';
  }

  const doc = (data.documentNumber || '').trim();
  if (doc) {
    if (!/^\d+$/.test(doc)) {
      return 'El documento debe contener únicamente números';
    }
    if (doc.length !== 8 && doc.length !== 11) {
      return 'El documento debe ser un DNI (8 dígitos) o RUC (11 dígitos)';
    }
    if (doc.length === 11 && !REGEX_RUC.test(doc)) {
      return 'El RUC debe comenzar con 10 o 20 y tener 11 dígitos';
    }
  }

  const phone = (data.phone || '').trim();
  if (phone && !REGEX_PHONE_PE.test(phone)) {
    return 'El teléfono debe ser un celular válido de 9 dígitos que empiece con 9 (ej. 987654321)';
  }

  const email = (data.email || '').trim();
  if (email && !REGEX_EMAIL.test(email)) {
    return 'El formato de correo electrónico no es válido (ej. contacto@empresa.com)';
  }

  return null;
};

export const validateAgrochemical = (data: AgrochemicalValidatorData): string | null => {
  if (!data.commercialName || !data.commercialName.trim()) {
    return 'El nombre comercial del agroquímico es obligatorio';
  }
  if (data.commercialName.trim().length < 3) {
    return 'El nombre comercial debe tener al menos 3 caracteres';
  }

  if (!data.activeIngredient || !data.activeIngredient.trim()) {
    return 'El ingrediente activo es obligatorio';
  }

  if (data.maxDose !== '' && data.maxDose !== undefined) {
    const dose = Number.parseFloat(String(data.maxDose));
    if (Number.isNaN(dose) || dose <= 0) {
      return 'La dosis máxima recomendada debe ser un número mayor a 0';
    }
  }

  if (data.waitingPeriodDays !== '' && data.waitingPeriodDays !== undefined) {
    const days = Number.parseInt(String(data.waitingPeriodDays), 10);
    if (Number.isNaN(days) || days < 0) {
      return 'El periodo de carencia no puede ser negativo';
    }
  }

  return null;
};

export const validateApplication = (data: ApplicationValidatorData): string | null => {
  if (!data.fieldSector || !data.fieldSector.trim()) {
    return 'El sector o parcela de campo es obligatorio';
  }
  if (!data.cropType || !data.cropType.trim()) {
    return 'El tipo de cultivo es obligatorio';
  }

  const area = Number.parseFloat(String(data.appliedAreaHectares));
  if (data.appliedAreaHectares === '' || Number.isNaN(area) || area <= 0) {
    return 'El área aplicada debe ser un valor mayor a 0 hectáreas';
  }

  const dose = Number.parseFloat(String(data.dosePerHectare));
  if (data.dosePerHectare === '' || Number.isNaN(dose) || dose <= 0) {
    return 'La dosis por hectárea debe ser un valor mayor a 0';
  }

  return null;
};
