export type AgrochemicalCategory =
  | 'INSECTICIDE'
  | 'FUNGICIDE'
  | 'HERBICIDE'
  | 'FERTILIZER'
  | 'BIOSTIMULANT'
  | 'OTHER';

export interface Agrochemical {
  id?: string;
  commercialName: string;
  activeIngredient: string;
  category?: AgrochemicalCategory | string;
  senasaRegistrationNumber?: string;
  registrationExpiry?: string;
  maxDose?: number;
  waitingPeriodDays?: number;
  manufacturer?: string;
  active?: boolean;
}

export interface AgrochemicalFormData {
  commercialName: string;
  activeIngredient: string;
  category: string;
  senasaRegistrationNumber: string;
  registrationExpiry: string;
  maxDose: string;
  waitingPeriodDays: string;
  manufacturer: string;
}

export type AgrochemicalPayload = Omit<Agrochemical, 'id'>;
