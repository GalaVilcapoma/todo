/**
 * Contratos de datos del backend Spring WebFlux (ASE251S4_T08-be).
 *
 * Reglas que respeta este archivo:
 *  - Los nombres de campo son EXACTAMENTE los del backend (camelCase). No se
 *    inventan alias ni campos duplicados.
 *  - Todo campo que el backend puede devolver como `null` se tipa `| null`,
 *    porque Jackson serializa los nulls (no hay @JsonInclude en el proyecto).
 *  - Los recursos de MongoDB usan `id: string` (ObjectId hex).
 *  - Los recursos transaccionales de R2DBC usan `id: number` (Long identity).
 *  - `TInput` son los cuerpos de escritura: solo contienen campos que el
 *    servicio copia al registro, para no pisar columnas administradas por el
 *    backend (`active`, `state`, `createdAt`, `updatedAt`, `deletedAt`, ...).
 */

// ---------------------------------------------------------------------------
// Genéricos
// ---------------------------------------------------------------------------

export interface ApiResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/** Filtro de estado reutilizable en los listados con soft delete. */
export type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

// ---------------------------------------------------------------------------
// Sesión local
// ---------------------------------------------------------------------------

export type UserRole =
  | 'ADMIN'
  | 'GERENTE'
  | 'OPERADOR'
  | 'SUPERVISOR'
  | 'TECHNICIAN'
  | 'LOGISTICS'
  | 'CERTIFICACIONES';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

/** Credenciales del login local (ver services/auth.service.ts). */
export interface LoginPayload {
  username: string;
  password: string;
}

// ---------------------------------------------------------------------------
// Agroquímicos — MongoDB `agrochemicals`, id: string
// ---------------------------------------------------------------------------

export const AGRO_CATEGORY_VALUES = [
  'INSECTICIDE',
  'FUNGICIDE',
  'HERBICIDE',
  'FERTILIZER',
  'BIOSTIMULANT',
  'OTHER',
] as const;

export type AgroCategory = (typeof AGRO_CATEGORY_VALUES)[number];

export interface Agrochemical {
  id: string;
  commercialName: string | null;
  activeIngredient: string | null;
  category: AgroCategory | null;
  senasaRegistrationNumber: string | null;
  /** LocalDate → "yyyy-MM-dd" */
  registrationExpiry: string | null;
  /** BigDecimal. El backend lo usa como costo unitario al calcular detalles. */
  maxDose: number | null;
  waitingPeriodDays: number | null;
  manufacturer: string | null;
  active: boolean | null;
  createdAt: string | null;
  updatedAt: string | null;
  deletedAt: string | null;
  restoredAt: string | null;
}

/**
 * `category` y `maxDose` son obligatorios en la UI: el backend desreferencia
 * ambos al construir una aplicación (`agro.getCategory().toString()` y
 * `appliedDose.multiply(agro.getMaxDose())`), así que un agroquímico sin ellos
 * provoca un NullPointerException al usarlo en una aplicación.
 */
export interface AgrochemicalInput {
  commercialName: string;
  activeIngredient: string;
  category: AgroCategory;
  senasaRegistrationNumber: string;
  registrationExpiry: string | null;
  maxDose: number;
  waitingPeriodDays: number;
  manufacturer: string;
}

// ---------------------------------------------------------------------------
// Clientes — MongoDB `customers`, id: string
// ---------------------------------------------------------------------------

/** `state` es el campo real de estado: "A" activo, "I" inactivo. */
export type CustomerState = 'A' | 'I';

export interface Customer {
  id: string;
  code: string | null;
  businessName: string | null;
  ruc: string | null;
  documentType: string | null;
  documentNumber: string | null;
  country: string | null;
  city: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  primaryContact: string | null;
  customerType: string | null;
  state: CustomerState | null;
  /**
   * OJO: el backend NUNCA escribe este campo, siempre llega `null`.
   * La fuente de verdad del estado es `state`. Ver `isCustomerActive`.
   */
  active: boolean | null;
  createdAt: string | null;
  updatedAt: string | null;
  deletedAt: string | null;
  restoredAt: string | null;
}

export interface CustomerInput {
  code: string;
  businessName: string;
  ruc: string;
  documentType: string;
  documentNumber: string;
  country: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  primaryContact: string;
  customerType: string;
}

// ---------------------------------------------------------------------------
// Productos — MongoDB `products`, id: string
// ---------------------------------------------------------------------------

/** El backend guarda la unidad como texto libre y el seed usa "Litros"/"Kilogramos". */
export type UnitMeasure = string;

export interface Product {
  id: string;
  code: string | null;
  name: string | null;
  category: string | null;
  description: string | null;
  unitMeasure: string | null;
  unitPrice: number | null;
  currentStock: number | null;
  minimumStock: number | null;
  origin: string | null;
  active: boolean | null;
  createdAt: string | null;
  updatedAt: string | null;
  deletedAt: string | null;
  restoredAt: string | null;
}

/**
 * `ProductoServiceImpl.validar()` exige code, name, category, unitMeasure,
 * unitPrice y origin. Además `editar()` copia TODOS los campos desde el body,
 * por lo que `currentStock` y `minimumStock` deben enviarse siempre o se
 * reinician a 0.
 */
export interface ProductInput {
  code: string;
  name: string;
  category: string;
  description: string;
  unitMeasure: UnitMeasure;
  unitPrice: number;
  currentStock: number;
  minimumStock: number;
  origin: string;
}

// ---------------------------------------------------------------------------
// Aplicaciones — R2DBC `agrochemical_applications`, id: number
// ---------------------------------------------------------------------------

export const APPLICATION_STATUSES = [
  'SCHEDULED',
  'IN_PROCESS',
  'COMPLETED',
  'CANCELLED',
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export interface ApplicationDetail {
  id: number;
  agrochemicalId: string;
  agrochemicalName: string | null;
  category: string | null;
  appliedDose: number | null;
  unitMeasure: string | null;
  treatedAreaHectares: number | null;
  unitCost: number | null;
  totalCost: number | null;
  remark: string | null;
}

export interface Application {
  id: number;
  applicationNumber: string | null;
  fieldName: string | null;
  areaHectares: number | null;
  /** LocalDate → "yyyy-MM-dd" */
  applicationDate: string | null;
  responsible: string | null;
  temperatureCelsius: number | null;
  humidityPercentage: number | null;
  windConditions: string | null;
  status: ApplicationStatus | null;
  remarks: string | null;
  totalProducts: number | null;
  totalCost: number | null;
  createdAt: string | null;
  details: ApplicationDetail[];
}

/** El backend rechaza el guardado si `details` viene vacío. */
export interface ApplicationDetailInput {
  agrochemicalId: string;
  appliedDose: number;
  unitMeasure: string;
  treatedAreaHectares: number;
  remark: string;
}

export interface ApplicationInput {
  fieldName: string;
  areaHectares: number | null;
  applicationDate: string | null;
  responsible: string;
  temperatureCelsius: number | null;
  humidityPercentage: number | null;
  windConditions: string;
  remarks: string;
  details: ApplicationDetailInput[];
}

// ---------------------------------------------------------------------------
// Pedidos — R2DBC `customer_orders_s4`, id: number
// ---------------------------------------------------------------------------

export const ORDER_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'IN_PROCESS',
  'DELIVERED',
  'CANCELLED',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface OrderDetail {
  id: number;
  productId: string;
  productName: string | null;
  productUnitMeasure: string | null;
  quantity: number | null;
  unitPrice: number | null;
  subtotal: number | null;
  remark: string | null;
  createdAt: string | null;
}

export interface Order {
  id: number;
  orderNumber: string | null;
  /** ObjectId de MongoDB, no un id de R2DBC. */
  customerId: string | null;
  customerBusinessName: string | null;
  orderDate: string | null;
  estimatedDeliveryDate: string | null;
  status: OrderStatus | null;
  remarks: string | null;
  subtotal: number | null;
  /** IGV 18%, calculado por el backend. */
  taxAmount: number | null;
  total: number | null;
  createdAt: string | null;
  updatedAt: string | null;
  active: boolean | null;
  details: OrderDetail[];
}

/**
 * No se envían unitPrice/subtotal/total/taxAmount: el backend los calcula
 * desde `products.unitPrice`. Enviar los precios calculados en el móvil
 * abriría la puerta a diferencias de redondeo.
 */
export interface OrderInput {
  customerId: string;
  estimatedDeliveryDate: string | null;
  remarks: string;
  details: OrderDetailInput[];
}

export interface OrderDetailInput {
  productId: string;
  quantity: number;
  remark: string;
}

// ---------------------------------------------------------------------------
// Movimientos de stock — R2DBC `product_stock_movements`, id: number
// ---------------------------------------------------------------------------

export type MovementType = 'IN' | 'OUT';

export interface StockMovement {
  id: number;
  movementNumber: string | null;
  productId: string | null;
  productName: string | null;
  unitMeasure: string | null;
  movementType: MovementType | null;
  quantity: number | null;
  unitCost: number | null;
  totalValue: number | null;
  movementDate: string | null;
  reason: string | null;
  warehouse: string | null;
  responsible: string | null;
  remarks: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  active: boolean | null;
}

/**
 * `movementType` no se envía: el endpoint `/in` y `/out` lo fija el servidor.
 */
export interface StockMovementInput {
  productId: string;
  quantity: number;
  movementDate: string | null;
  reason: string;
  warehouse: string;
  responsible: string;
  remarks: string;
}

// ---------------------------------------------------------------------------
// Agregaciones — MongoDB, respuestas con forma libre
// ---------------------------------------------------------------------------

export interface ProductCategorySummary {
  category: string | null;
  totalProducts: number;
  totalStock: number;
  averagePrice: number | null;
}

export interface ManufacturerSummary {
  manufacturer: string | null;
  totalProducts: number;
  categories: string[];
  averageWaitingDays: number | null;
}