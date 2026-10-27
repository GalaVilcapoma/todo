# AVSA — App móvil (ASE251S4_T08_mo)

Aplicación móvil del sistema de gestión agroquímica **AVSA**. Consume la API del
backend Spring WebFlux (`ASE251S4_T08-be`) y cubre sus siete módulos.

## Stack

- Expo SDK 57 · React Native 0.86 · New Architecture
- Expo Router 57 (enrutado por archivos)
- TypeScript 6
- Axios para HTTP, AsyncStorage para sesión local, `expo-haptics` para feedback

## Requisitos

- Node 20+
- Un dispositivo o emulador con Expo Go, o un development build (la app usa
  `expo-haptics`, que es código nativo y no viene incluido en Expo Go)

## Configuración

La URL del backend se lee de la variable `EXPO_PUBLIC_API_URL` en `.env`:

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.84:8081
```

Elige la URL según dónde corras el backend:

| Entorno | Valor |
| --- | --- |
| Emulador Android | `http://10.0.2.2:8081` (alias del host) |
| iOS Simulator | `http://localhost:8081` |
| Dispositivo real | IP LAN del equipo, p. ej. `http://192.168.1.84:8081` |

El backend no tiene context-path, así que las rutas empiezan en la raíz
(`/v1/api/...`, salvo productos que usa `/api/productos`).

## Comandos

```bash
npx expo start              # servidor de desarrollo
npx expo start --android    # abrir en emulador Android
npx expo start --ios        # abrir en simulador iOS
npx expo lint               # ESLint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnóstico de dependencias y config
npx expo install --fix      # ajustar versiones incompatibles
```

## Distribución: ejecución local

Esta aplicación es un cliente móvil Expo/React Native y se ejecuta localmente
con `npx expo start` (Expo Go o development build). No se despliega en Kubernetes:
los manifiestos K8s del proyecto corresponden a los backends y al frontend web.
Para una distribución instalable se usaría EAS Build, fuera del alcance actual.

## Pantalla de login: por qué es local

El backend **no implementa autenticación**. No incluye `spring-security`, no hay
`SecurityConfig` ni filtro de Bearer, no existe `POST /api/auth/login` y ningún
endpoint lee la cabecera `Authorization`. Todos los controladores están abiertos.

Por eso el login valida contra perfiles guardados en el dispositivo y **no envía
creenciales al servidor**. La propia pantalla lo advierte. No es un login
seguro: solo ordena el flujo de la app.

| Usuario | Contraseña | Rol |
| --- | --- | --- |
| `admin` | `admin123` | Administrador |
| `gerente` | `gerente123` | Gerente |
| `operador` | `operador123` | Operador |

Cuando el backend incorpore autenticación real, el único archivo a reemplazar es
`services/auth.service.ts`.

## Módulos

Siete módulos, seis pestañas visibles más una pantalla **Más** que enlaza a
Pedidos, Movimientos de stock y Reportes (la barra de pestañas de Expo Router no
tiene scroll horizontal y los siete módulos no caben en pantalla).

| Módulo | Ruta | Endpoint |
| --- | --- | --- |
| Dashboard | `/` | varios + agregaciones |
| Agroquímicos | `/agrochemicals` | `/v1/api/agrochemicals` |
| Aplicaciones | `/applications` | `/v1/api/agrochemical-applications` |
| Clientes | `/clients` | `/v1/api/customer` |
| Productos | `/products` | `/api/productos` |
| Pedidos | `/orders` | `/v1/api/customer-orders` |
| Movimientos de stock | `/stock` | `/v1/api/stock-movements` |
| Reportes | `/reports` | `/v1/api/aggregations` |
| Más | `/more` | — |

## Detalles del contrato con el backend

Estas son las particularidades del backend que la app respeta; están documentadas
en el código donde aplican.

### IDs y persistencia

Los maestros viven en MongoDB y usan `id: string` (ObjectId). Los recursos
transaccionales viven en R2DBC y usan `id: number` (`Long`):

- string: agroquímicos, clientes, productos, y las referencias `productId` /
  `customerId` dentro de aplicaciones y pedidos.
- number: aplicaciones, pedidos, movimientos de stock.

### Clientes: el estado es `state`, no `active`

El campo real de estado es `state` (`'A'` activo, `'I'` inactivo). El campo
`active` existe en el modelo pero **el backend nunca lo escribe**, así que siempre
llega `null`. Usarlo como fuente de verdad marcaría a todos los clientes como
inactivos. Ver `isCustomerActive` en `services/customer.service.ts`.

Las rutas de borrado y restauración están invertidas respecto a agroquímicos y
productos: clientes usa `PATCH /delete/{id}` y `PATCH /restore/{id}`.

El RUC es opcional para clientes del exterior y solo se exige cuando
`documentType` es `RUC`; si se ingresa, se validan sus 11 dígitos.

### Productos: editar sobrescribe el inventario

`ProductoServiceImpl.editar()` copia **todos** los campos desde el body y pone
`currentStock` y `minimumStock` en 0 cuando llegan nulos. Por eso el formulario de
edición de productos incluye ambos valores: omitirlos borraría el inventario.

`validar()` exige `code`, `name`, `category`, `unitMeasure`, `unitPrice` y
`origin`. La unidad es texto libre: el seed usa `Litros` y `Kilogramos`, y el
formulario conserva cualquier valor existente que no esté en el catálogo.

### Agroquímicos: `category` y `maxDose` son obligatorios

El backend los desreferencia sin comprobación al construir una aplicación
(`agro.getCategory().toString()` y `appliedDose.multiply(agro.getMaxDose())`), así
que un agroquímico sin ellos provoca un `NullPointerException` del lado del
servidor cuando se usa en una aplicación. Ambos campos son obligatorios en el
formulario.

### Aplicaciones y pedidos requieren detalles anidados

Ambos rechazan el guardado si `details` llega vacío, y los servicios calculan
precios y totales desde los datos del servidor.

Aplicaciones: `appliedDose` debe estar en `(0, maxDose]` del agroquímico y
`treatedAreaHectares` debe ser positivo. Sólo se ofrecen agroquímicos activos.

Pedidos: el cliente debe estar activo, cada producto debe existir y estar activo,
la cantidad no puede superar el stock disponible. Crear el pedido **descuenta**
stock; editar devuelve el de las líneas anteriores y descuenta el nuevo;
cancelar devuelve el stock al inventario.

Los precios, el subtotal y el IGV los calcula el backend, así que
`OrderInput` y `ApplicationInput` no los incluyen.

### Movimientos de stock

El tipo de movimiento (`IN` / `OUT`) lo fija el endpoint `/in` o `/out`, no el
payload. Registrar un movimiento actualiza `products.currentStock` en MongoDB,
por eso la pantalla refresca también la lista de productos.

### Agregaciones

`/v1/api/aggregations` devuelve `Flux<Map<String, Object>>`: la forma exacta la
define el pipeline de MongoDB, no un DTO. `services/aggregation.service.ts`
normaliza los campos de forma defensiva para que un campo ausente o con otro tipo
no rompa la pantalla de reportes.

### Errores

El backend no usa `@ControllerAdvice`. Los errores llegan como el cuerpo estándar
de Spring WebFlux (`{"status":..,"error":..,"message":..}`), como
`{"error": "..."}` en los `PATCH` de agroquímicos que capturan su propia
excepción, o como texto plano. `toApiError` recorre esas variantes y devuelve un
mensaje presentable, sin que las pantallas conozcan axios.

También se detectan respuestas **HTTP 200 con error embebido**: los `PATCH`
delete/restore de agroquímicos capturan la excepción y la devuelven en el cuerpo
con código 200.

Dos endpoints devuelven listas vacías en lugar de error cuando no encuentran
nada (`AgrochemicalApplicationService.listAll` termina en
`onErrorResume(e -> Flux.empty())`), y los `findById` de aplicaciones y pedidos
responden 200 con cuerpo vacío ante un id inexistente; el servicio lo rechaza
explícitamente para no devolver un `undefined` silencioso.

### Fechas

`LocalDate` llega como `"yyyy-MM-dd"` sin zona. `new Date("2026-10-01")` lo
interpreta como medianoche UTC y en husos negativos el día local retrocede una
unidad. `utils/format.ts` parte la fecha por cadena para las fechas de solo día.

## Estructura

```
app/                    pantallas y layouts (Expo Router)
  _layout.tsx           Stack raíz con Stack.Protected como guard de sesión
  login.tsx             login local de demostración
  (tabs)/               las seis pestañas y sus layouts
components/common/      AppInput, AppButton, AppHeader, SelectField,
                        ConfirmDialog, StatCard, ScreenContainer
components/ui/          Badge, EmptyState, ErrorBanner, FilterTabs,
                        SkeletonCard, BottomSheetModal
constants/              colors, theme, config (endpoints y catálogos)
hooks/                  useResource / useCrudResource / useSoftDelete,
                        useAuth, useDashboard
services/               un archivo por módulo + api.service y auth.service
store/auth.store.tsx    contexto de sesión
types/index.ts          contratos exactos del backend
utils/                  format, haptics, storage
```

## Decisiones de implementación

**Guard de sesión con `Stack.Protected`.** Durante la restauración de la sesión el
usuario está "deslogueado" unos milisegundos. Un `router.replace` basado en ese
estado lo expulsaría al login antes de que `loadSession` termine. `Stack.Protected`
no monta la ruta hasta que el guard resuelve, así que no hay parpadeo ni carrera,
y las pantallas privadas no se montan (ni disparan peticiones) sin sesión.

**Recarga en vez de parche optimista.** Tras cada mutación los hooks vuelven a
pedir la lista completa al servidor. El backend calcula `active`, `state`,
`createdAt` y otros campos en cada escritura; parchear el estado local los
desincronizaría.

**`Promise.allSettled` en el dashboard.** Si falla un endpoint, el dashboard sigue
mostrando el resto en lugar de quedarse en blanco.
