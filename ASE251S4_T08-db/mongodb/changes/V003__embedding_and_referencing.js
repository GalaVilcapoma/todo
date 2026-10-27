// =============================================================
// V003__embedding_and_referencing.js
// Estrategias de modelado: Embedding y Referencing
// Proyecto: AVSA Cañete — Equipo 08
//
// Este script crea colecciones _v2 que demuestran las dos
// estrategias principales de modelado en MongoDB:
//
// EMBEDDING (subdocumentos incrustados):
//   - productos_v2      → atributos variables por categoría
//   - customer_v2       → contactos y direcciones embebidos
//   - notificaciones_v2 → snapshot inmutable del evento
//
// REFERENCING (solo el identificador del dato relacionado):
//   - agrochemicals_v2  → fabricanteCodigo referencia a fabricante
//   - pedidos_detalle   → clienteCodigo referencia a customer
//   - audit_logs_v2     → modulo + entidadId referencia externa
// =============================================================

var adminDb = db.getSiblingDB('admin');
adminDb.auth(
    process.env.MONGO_INITDB_ROOT_USERNAME,
    process.env.MONGO_INITDB_ROOT_PASSWORD
);

var avsa = db.getSiblingDB('db_avsa');

// ══════════════════════════════════════════════════════════════
// EMBEDDING — Estrategia 1
// ══════════════════════════════════════════════════════════════

// ── productos_v2: atributos variables embebidos ──────────────
// Cada producto tiene un subdocumento "atributos" cuyo esquema
// varía según la categoría (fruta, grano, hortaliza, etc.).
// En SQL esto requeriría columnas nulas o tablas EAV.
avsa.createCollection('productos_v2', {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['codigo', 'nombre', 'categoria', 'precioUnitario', 'atributos'],
            properties: {
                codigo:         { bsonType: 'string' },
                nombre:         { bsonType: 'string' },
                categoria:      { bsonType: 'string' },
                precioUnitario: { bsonType: ['decimal', 'double', 'int'] },
                atributos:      { bsonType: 'object', description: 'Subdocumento con atributos variables por categoría' },
                estado:         { bsonType: 'bool' }
            }
        }
    },
    validationLevel: 'moderate'
});
avsa.productos_v2.createIndex({ codigo: 1 }, { unique: true, name: 'idx_productos_v2_codigo' });
print('[INFO] Colección productos_v2 creada (EMBEDDING: atributos variables).');

// Datos semilla — productos con atributos embebidos
avsa.productos_v2.insertMany([
    {
        codigo: 'PV2-001', nombre: 'Mandarina Satsuma Premium',
        categoria: 'Cítricos', precioUnitario: NumberDecimal('92.00'),
        stockActual: 480, unidadMedida: 'Caja',
        origen: 'Cañete - San Vicente',
        atributos: {
            calibre: '58-67 mm',
            gradosBrix: 12.5,
            colorPiel: 'Naranja intenso',
            sinSemillas: true,
            certificacionOrganica: false
        },
        estado: true, createdAt: new Date()
    },
    {
        codigo: 'PV2-002', nombre: 'Palta Hass Export',
        categoria: 'Frutas', precioUnitario: NumberDecimal('135.00'),
        stockActual: 320, unidadMedida: 'Caja',
        origen: 'Cañete - Lunahuaná',
        atributos: {
            calibre: '16-20',
            contenidoGrasa: 23.4,
            madurez: 'Preclimatérica',
            destinoExport: true,
            certificaciones: ['GlobalGAP', 'HACCP']
        },
        estado: true, createdAt: new Date()
    },
    {
        codigo: 'PV2-003', nombre: 'Maíz Morado Seco',
        categoria: 'Granos', precioUnitario: NumberDecimal('58.00'),
        stockActual: 900, unidadMedida: 'Saco',
        origen: 'Cañete - Quilmaná',
        atributos: {
            humedad: 14.0,
            variedadLocal: 'Carazas',
            usoIndustrial: 'Colorante natural y chicha morada',
            granosPartidos: 2.1
        },
        estado: true, createdAt: new Date()
    }
]);
print('[INFO] productos_v2: 3 documentos insertados con atributos embebidos.');

// ── customer_v2: contactos y direcciones embebidos ───────────
// Los contactos y direcciones de entrega del cliente se guardan
// como arrays de subdocumentos. Siempre se consultan junto al
// cliente y su cantidad es acotada (máx 5-10).
avsa.createCollection('customer_v2', {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['codigo', 'razonSocial', 'pais', 'tipoCliente'],
            properties: {
                codigo:       { bsonType: 'string' },
                razonSocial:  { bsonType: 'string' },
                pais:         { bsonType: 'string' },
                tipoCliente:  { bsonType: 'string', enum: ['NACIONAL', 'INTERNACIONAL'] },
                contactos:    { bsonType: 'array', description: 'Lista de contactos embebidos' },
                direccionesEntrega: { bsonType: 'array', description: 'Direcciones de entrega embebidas' },
                active:       { bsonType: 'bool' }
            }
        }
    },
    validationLevel: 'moderate'
});
avsa.customer_v2.createIndex({ codigo: 1 }, { unique: true, name: 'idx_customer_v2_codigo' });
print('[INFO] Colección customer_v2 creada (EMBEDDING: contactos y direcciones).');

avsa.customer_v2.insertMany([
    {
        codigo: 'CLI-001', razonSocial: 'Agroindustrias del Sur S.A.C.',
        ruc: '20512345678', pais: 'Perú', tipoCliente: 'NACIONAL',
        contactos: [
            { nombre: 'Luis Paredes', cargo: 'Gerente Compras', telefono: '01-4567890', email: 'lparedes@agroindsur.pe', principal: true },
            { nombre: 'Ana Torres', cargo: 'Asistente Logística', telefono: '01-4567891', email: 'atorres@agroindsur.pe', principal: false }
        ],
        direccionesEntrega: [
            { alias: 'Almacén Central', direccion: 'Av. La Marina 1234, Lima', distrito: 'San Miguel', referencia: 'Frente al parque', predeterminada: true },
            { alias: 'Planta Procesadora', direccion: 'Km 18 Panamericana Sur', distrito: 'Lurín', referencia: 'Zona industrial', predeterminada: false }
        ],
        active: true, createdAt: new Date()
    },
    {
        codigo: 'CLI-002', razonSocial: 'Fresh Fruits Export Ltd.',
        pais: 'Estados Unidos', tipoCliente: 'INTERNACIONAL',
        contactos: [
            { nombre: 'John Smith', cargo: 'Import Manager', telefono: '+1-305-1234567', email: 'jsmith@freshfruits.com', principal: true }
        ],
        direccionesEntrega: [
            { alias: 'Miami Warehouse', direccion: '1200 Brickell Ave, Miami FL 33131', distrito: 'Brickell', referencia: 'Dock B', predeterminada: true }
        ],
        active: true, createdAt: new Date()
    }
]);
print('[INFO] customer_v2: 2 documentos insertados con contactos y direcciones embebidos.');

// ── notificaciones_v2: snapshot inmutable del evento ─────────
// Cada notificación captura un snapshot completo del contexto
// (productor, campo, agroquímico) tal como estaba en ese momento.
// Como es historial, no debe cambiar — el embedding lo garantiza.
avsa.createCollection('notificaciones_v2');
avsa.notificaciones_v2.createIndex({ 'snapshot.productorCodigo': 1, fechaHora: -1 }, { name: 'idx_notif_v2_productor_fecha' });
print('[INFO] Colección notificaciones_v2 creada (EMBEDDING: snapshot inmutable).');

avsa.notificaciones_v2.insertMany([
    {
        tipo: 'APLICACION_CAMPO',
        mensaje: 'Aplicación de Confidor 350 SC registrada en Parcela Norte',
        fechaHora: new Date(),
        estado: 'NO_LEIDA',
        snapshot: {
            productorCodigo: 'PROD-001',
            productorNombre: 'Roberto Sánchez Huamán',
            campoCodigo: 'CAMPO-001',
            campoNombre: 'Fundo Santa Rosa - Parcela Norte',
            campoUbicacion: 'San Vicente, Cañete',
            agroquimicoCodigo: 'SEN-2024-006',
            agroquimicoNombre: 'Confidor 350 SC',
            dosisAplicada: 0.40,
            unidadDosis: 'L/ha',
            cultivo: 'Mandarina Satsuma'
        }
    },
    {
        tipo: 'ALERTA_SENASA',
        mensaje: 'Dosis excedida: Karate Zeon en Campo Principal Valle',
        fechaHora: new Date(),
        estado: 'NO_LEIDA',
        snapshot: {
            productorCodigo: 'PROD-002',
            productorNombre: 'José Luis Quispe Mamani',
            campoCodigo: 'CAMPO-003',
            campoNombre: 'Campo Principal Valle',
            campoUbicacion: 'Lunahuaná, Cañete',
            agroquimicoCodigo: 'SEN-2024-002',
            agroquimicoNombre: 'Karate Zeon',
            dosisAplicada: 2.0,
            dosisMaxima: 1.5,
            unidadDosis: 'L/ha',
            cultivo: 'Uva Red Globe',
            alerta: 'DOSIS_EXCEDIDA'
        }
    }
]);
print('[INFO] notificaciones_v2: 2 documentos insertados con snapshot embebido.');


// ══════════════════════════════════════════════════════════════
// REFERENCING — Estrategia 2
// ══════════════════════════════════════════════════════════════

// ── Colección maestro: fabricantes ───────────────────────────
// Los fabricantes viven en su propia colección. agrochemicals_v2
// solo guarda fabricanteCodigo como referencia.
avsa.createCollection('fabricantes', {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['codigo', 'nombre', 'pais'],
            properties: {
                codigo: { bsonType: 'string' },
                nombre: { bsonType: 'string' },
                pais:   { bsonType: 'string' }
            }
        }
    },
    validationLevel: 'moderate'
});
avsa.fabricantes.createIndex({ codigo: 1 }, { unique: true, name: 'idx_fabricantes_codigo' });

avsa.fabricantes.insertMany([
    { codigo: 'FAB-001', nombre: 'Syngenta', pais: 'Suiza', telefono: '+41-61-3231111', email: 'contact@syngenta.com', active: true },
    { codigo: 'FAB-002', nombre: 'Bayer CropScience', pais: 'Alemania', telefono: '+49-214-301', email: 'info@bayer.com', active: true },
    { codigo: 'FAB-003', nombre: 'BASF', pais: 'Alemania', telefono: '+49-621-600', email: 'info@basf.com', active: true },
    { codigo: 'FAB-004', nombre: 'FMC Corporation', pais: 'Estados Unidos', telefono: '+1-215-2996000', email: 'info@fmc.com', active: true },
    { codigo: 'FAB-005', nombre: 'BioAgro Peru', pais: 'Perú', telefono: '01-4456789', email: 'ventas@bioagro.pe', active: true }
]);
print('[INFO] Colección fabricantes creada con 5 documentos.');

// ── agrochemicals_v2: referencia al fabricante ───────────────
// En lugar de embeber los datos del fabricante (que se repiten
// en muchos agroquímicos), solo guardamos fabricanteCodigo.
// Si Syngenta cambia su teléfono, se actualiza en un solo lugar.
avsa.createCollection('agrochemicals_v2', {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['commercialName', 'activeIngredient', 'category', 'fabricanteCodigo'],
            properties: {
                commercialName:   { bsonType: 'string' },
                activeIngredient: { bsonType: 'string' },
                category:         { bsonType: 'string' },
                fabricanteCodigo: { bsonType: 'string', description: 'REFERENCIA a fabricantes.codigo' },
                active:           { bsonType: 'bool' }
            }
        }
    },
    validationLevel: 'moderate'
});
avsa.agrochemicals_v2.createIndex({ fabricanteCodigo: 1 }, { name: 'idx_agro_v2_fabricante' });
print('[INFO] Colección agrochemicals_v2 creada (REFERENCING: fabricanteCodigo).');

avsa.agrochemicals_v2.insertMany([
    {
        commercialName: 'Karate Zeon', activeIngredient: 'Lambda-Cialotrina 5%',
        category: 'INSECTICIDE', senasaRegistrationNumber: 'SEN-2024-002',
        registrationExpiry: new Date('2027-06-30'), maxDose: NumberDecimal('1.5'),
        waitingPeriodDays: 21, fabricanteCodigo: 'FAB-001',
        active: true, createdAt: new Date()
    },
    {
        commercialName: 'Amistar Top', activeIngredient: 'Azoxystrobin 20% + Difenoconazol 12.5%',
        category: 'FUNGICIDE', senasaRegistrationNumber: 'SEN-2024-007',
        registrationExpiry: new Date('2028-02-28'), maxDose: NumberDecimal('1.0'),
        waitingPeriodDays: 21, fabricanteCodigo: 'FAB-001',
        active: true, createdAt: new Date()
    },
    {
        commercialName: 'Confidor 350 SC', activeIngredient: 'Imidacloprid 35%',
        category: 'INSECTICIDE', senasaRegistrationNumber: 'SEN-2024-006',
        registrationExpiry: new Date('2027-03-20'), maxDose: NumberDecimal('0.8'),
        waitingPeriodDays: 14, fabricanteCodigo: 'FAB-002',
        active: true, createdAt: new Date()
    },
    {
        commercialName: 'Stomp Aqua', activeIngredient: 'Pendimetalina 45.5%',
        category: 'HERBICIDE', senasaRegistrationNumber: 'SEN-2024-013',
        registrationExpiry: new Date('2027-01-20'), maxDose: NumberDecimal('3.5'),
        waitingPeriodDays: 45, fabricanteCodigo: 'FAB-003',
        active: true, createdAt: new Date()
    }
]);
print('[INFO] agrochemicals_v2: 4 documentos insertados con referencia a fabricante.');

// ── pedidos_detalle: referencia al cliente ───────────────────
// El pedido guarda solo clienteCodigo. Un cliente puede aparecer
// en cientos de pedidos sin duplicar sus datos completos.
avsa.createCollection('pedidos_detalle', {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['numeroPedido', 'clienteCodigo', 'estado', 'items'],
            properties: {
                numeroPedido:  { bsonType: 'string' },
                clienteCodigo: { bsonType: 'string', description: 'REFERENCIA a customer.codigo' },
                estado:        { bsonType: 'string', enum: ['PENDIENTE', 'CONFIRMADO', 'EN_PROCESO', 'DESPACHADO', 'ENTREGADO', 'CANCELADO'] },
                items:         { bsonType: 'array' }
            }
        }
    },
    validationLevel: 'moderate'
});
avsa.pedidos_detalle.createIndex({ numeroPedido: 1 }, { unique: true, name: 'idx_pedidos_numero' });
avsa.pedidos_detalle.createIndex({ clienteCodigo: 1 }, { name: 'idx_pedidos_cliente' });
print('[INFO] Colección pedidos_detalle creada (REFERENCING: clienteCodigo).');

avsa.pedidos_detalle.insertMany([
    {
        numeroPedido: 'PED-2026-001',
        clienteCodigo: 'CLI-002',
        fechaPedido: new Date('2026-10-01'),
        estado: 'EN_PROCESO',
        items: [
            { productoCodigo: 'PROD-002', nombre: 'Palta Hass', cantidad: 50, precioUnitario: NumberDecimal('120.00'), subtotal: NumberDecimal('6000.00') },
            { productoCodigo: 'PROD-004', nombre: 'Espárrago Verde', cantidad: 100, precioUnitario: NumberDecimal('18.50'), subtotal: NumberDecimal('1850.00') }
        ],
        totalPedido: NumberDecimal('7850.00'),
        moneda: 'USD',
        observaciones: 'Despacho FOB Callao',
        createdAt: new Date()
    },
    {
        numeroPedido: 'PED-2026-002',
        clienteCodigo: 'CLI-001',
        fechaPedido: new Date('2026-10-05'),
        estado: 'CONFIRMADO',
        items: [
            { productoCodigo: 'PROD-001', nombre: 'Mandarina Satsuma', cantidad: 200, precioUnitario: NumberDecimal('85.00'), subtotal: NumberDecimal('17000.00') }
        ],
        totalPedido: NumberDecimal('17000.00'),
        moneda: 'PEN',
        observaciones: 'Entrega en almacén San Miguel',
        createdAt: new Date()
    }
]);
print('[INFO] pedidos_detalle: 2 documentos insertados con referencia a cliente.');

// ── audit_logs_v2: referencia a entidad genérica ─────────────
// Los logs guardan solo el módulo y el ID de la entidad afectada.
// Los logs crecen sin límite y la entidad puede ser de cualquier
// tipo, así que embeber sería inviable.
avsa.createCollection('audit_logs_v2');
avsa.audit_logs_v2.createIndex({ modulo: 1, entidadId: 1 }, { name: 'idx_audit_v2_modulo_entidad' });
avsa.audit_logs_v2.createIndex({ timestamp: -1 }, { name: 'idx_audit_v2_timestamp' });
avsa.audit_logs_v2.createIndex({ userName: 1 }, { name: 'idx_audit_v2_user' });
print('[INFO] Colección audit_logs_v2 creada (REFERENCING: modulo + entidadId).');

avsa.audit_logs_v2.insertMany([
    {
        accion: 'CREATE', modulo: 'CUSTOMER', entidadId: 'CLI-001',
        userName: 'admin', timestamp: new Date(),
        detalle: 'Cliente creado: Agroindustrias del Sur S.A.C.',
        ip: '192.168.1.100'
    },
    {
        accion: 'UPDATE', modulo: 'PRODUCTO', entidadId: 'PROD-001',
        userName: 'logistica1', timestamp: new Date(),
        detalle: 'Stock actualizado de 450 a 500',
        ip: '192.168.1.105'
    },
    {
        accion: 'CREATE', modulo: 'PEDIDO', entidadId: 'PED-2026-001',
        userName: 'admin', timestamp: new Date(),
        detalle: 'Pedido creado para Fresh Fruits Export Ltd. por USD 7,850.00',
        ip: '192.168.1.100'
    },
    {
        accion: 'UPDATE', modulo: 'AGROCHEMICAL', entidadId: 'SEN-2024-003',
        userName: 'cert_ana', timestamp: new Date(),
        detalle: 'Registro SENASA renovado hasta 2028-09-15',
        ip: '192.168.1.112'
    }
]);
print('[INFO] audit_logs_v2: 4 documentos insertados con referencia a entidad.');

print('[SUCCESS] V003 — Embedding y Referencing aplicados correctamente.');
