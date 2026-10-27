export interface Client {
  id?: string;
  businessName?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  documentNumber?: string;
  ruc?: string;
  primaryContact?: string;
  state?: string;
  active?: boolean;
}

export interface ClientFormData {
  businessName: string;
  documentNumber: string;
  email: string;
  phone: string;
  address: string;
  primaryContact: string;
}

export interface ClientPayload extends ClientFormData {
  firstName: string;
  fullName: string;
  ruc: string;
  state: string;
  active: boolean;
}
