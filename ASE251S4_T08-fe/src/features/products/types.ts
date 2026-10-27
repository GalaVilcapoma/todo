export interface Producto {
  id?: string;
  code?: string;
  name?: string;
  nombre?: string;
  description?: string;
  descripcion?: string;
  category?: string;
  categoria?: string;
  unitPrice?: number;
  price?: number;
  precio?: number;
  currentStock?: number;
  stock?: number;
  minimumStock?: number;
  unitMeasure?: string;
  unit?: string;
  unidad?: string;
  origin?: string;
  active?: boolean;
  estado?: boolean;
}

export interface ProductoFormData {
  code: string;
  name: string;
  description: string;
  category: string;
  unitPrice: string;
  currentStock: string;
  minimumStock: string;
  unitMeasure: string;
  origin: string;
}

export type ProductoPayload = Omit<
  ProductoFormData,
  'unitPrice' | 'currentStock' | 'minimumStock'
> & {
  unitPrice: number;
  currentStock: number;
  minimumStock: number;
  active: boolean;
};
