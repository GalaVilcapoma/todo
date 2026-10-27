export interface Application {
  id?: string;
  applicationDate?: string;
  fieldSector?: string;
  cropType?: string;
  appliedAreaHectares?: number;
  applicatorName?: string;
  agrochemicalId?: string;
  dosePerHectare?: number;
  notes?: string;
}

export interface ApplicationFormData {
  applicationDate: string;
  fieldSector: string;
  cropType: string;
  appliedAreaHectares: string;
  applicatorName: string;
  agrochemicalId: string;
  dosePerHectare: string;
  notes: string;
}

export type ApplicationPayload = Omit<
  ApplicationFormData,
  'appliedAreaHectares' | 'dosePerHectare'
> & {
  appliedAreaHectares: number;
  dosePerHectare: number;
};
