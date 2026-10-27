// =============================================================
// V001__baseline.js
// Baseline completo de la base de datos db_avsa
// Proyecto: AVSA Cañete — Equipo 08
//
// Este script es la "fotografía inicial" del esquema MongoDB.
// Se ejecuta una sola vez cuando el contenedor arranca con el
// volumen vacío. Incluye: selección de BD, colecciones con
// validadores, índices y datos semilla.
// =============================================================

var adminDb = db.getSiblingDB('admin');
adminDb.auth(
    process.env.MONGO_INITDB_ROOT_USERNAME,
    process.env.MONGO_INITDB_ROOT_PASSWORD
);

var avsa = db.getSiblingDB('db_avsa');

// ──────────────────────────────────────────────────────────────
// 1. COLECCIONES CON VALIDADORES
// MongoDB no impone esquema por defecto, así que definimos
// validadores JSON Schema para las colecciones críticas.
// validationLevel "moderate" permite insertar pero rechaza
// updates que violen el contrato.
// ──────────────────────────────────────────────────────────────

// Clientes / distribuidores — datos maestros de contacto
avsa.createCollection('customer', {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['codigo', 'razonSocial', 'pais', 'tipoCliente'],
            properties: {
                codigo:      { bsonType: 'string', description: 'Código único del cliente' },
                razonSocial: { bsonType: 'string', description: 'Razón social o nombre completo' },
                pais:        { bsonType: 'string', description: 'País de origen del cliente' },
                tipoCliente: { bsonType: 'string', enum: ['NACIONAL', 'INTERNACIONAL'] },
                active:      { bsonType: 'bool' }
            }
        }
    },
    validationLevel: 'moderate'
});
print('[INFO] Colección customer creada con validador.');

// Catálogo de productos agrícolas — atributos variables por categoría
avsa.createCollection('productos', {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['codigo', 'nombre', 'categoria', 'precioUnitario'],
            properties: {
                codigo:         { bsonType: 'string' },
                nombre:         { bsonType: 'string' },
                categoria:      { bsonType: 'string' },
                precioUnitario: { bsonType: ['decimal', 'double', 'int'] },
                stockActual:    { bsonType: 'int', minimum: 0 },
                estado:         { bsonType: 'bool' }
            }
        }
    },
    validationLevel: 'moderate'
});
print('[INFO] Colección productos creada con validador.');

// Agroquímicos — registro SENASA con esquema flexible por categoría
avsa.createCollection('agrochemicals', {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['commercialName', 'activeIngredient', 'category'],
            properties: {
                commercialName:   { bsonType: 'string' },
                activeIngredient: { bsonType: 'string' },
                category: {
                    bsonType: 'string',
                    enum: ['INSECTICIDE', 'FUNGICIDE', 'HERBICIDE', 'FERTILIZER', 'BIOSTIMULANT', 'OTHER']
                },
                active: { bsonType: 'bool' }
            }
        }
    },
    validationLevel: 'moderate'
});
print('[INFO] Colección agrochemicals creada con validador.');

// Notificaciones — eventos en tiempo real de baja latencia
avsa.createCollection('notificaciones');
print('[INFO] Colección notificaciones creada.');

// Métricas de dashboard — snapshots de KPIs generados periódicamente
avsa.createCollection('dashboard_metrics');
print('[INFO] Colección dashboard_metrics creada.');

// Auditoría — trazabilidad de acciones del sistema
avsa.createCollection('audit_logs');
print('[INFO] Colección audit_logs creada.');

// ──────────────────────────────────────────────────────────────
// 2. ÍNDICES
// Creados inmediatamente después de las colecciones para
// garantizar unicidad y acelerar las consultas frecuentes.
// ──────────────────────────────────────────────────────────────

// customer
avsa.customer.createIndex({ codigo: 1 },      { unique: true, name: 'idx_customer_codigo' });
avsa.customer.createIndex({ state: 1 },       { name: 'idx_customer_state' });
avsa.customer.createIndex({ tipoCliente: 1 }, { name: 'idx_customer_tipo' });
print('[INFO] Índices customer creados.');

// productos
avsa.productos.createIndex({ codigo: 1 },    { unique: true, name: 'idx_productos_codigo' });
avsa.productos.createIndex({ estado: 1 },    { name: 'idx_productos_estado' });
avsa.productos.createIndex({ categoria: 1 }, { name: 'idx_productos_categoria' });
avsa.productos.createIndex({ stockActual: 1 }, { name: 'idx_productos_stock' });
print('[INFO] Índices productos creados.');

// agrochemicals
avsa.agrochemicals.createIndex({ active: 1 },           { name: 'idx_agro_active' });
avsa.agrochemicals.createIndex({ category: 1 },         { name: 'idx_agro_category' });
avsa.agrochemicals.createIndex({ manufacturer: 1 },     { name: 'idx_agro_manufacturer' });
avsa.agrochemicals.createIndex({ registrationExpiry: 1 }, { name: 'idx_agro_expiry' });
print('[INFO] Índices agrochemicals creados.');

// notificaciones
avsa.notificaciones.createIndex({ usuario: 1, estado: 1 }, { name: 'idx_notif_usuario_estado' });
avsa.notificaciones.createIndex({ fechaHora: -1 },         { name: 'idx_notif_fecha' });
print('[INFO] Índices notificaciones creados.');

// audit_logs
avsa.audit_logs.createIndex({ userName: 1, timestamp: -1 }, { name: 'idx_audit_user_ts' });
avsa.audit_logs.createIndex({ modulo: 1 },                  { name: 'idx_audit_modulo' });
print('[INFO] Índices audit_logs creados.');

// dashboard_metrics
avsa.dashboard_metrics.createIndex({ generadoEn: -1 }, { name: 'idx_dashboard_fecha' });
print('[INFO] Índices dashboard_metrics creados.');

// ──────────────────────────────────────────────────────────────
// 3. DATOS SEMILLA
// Documentos mínimos para que el sistema arranque con
// información útil desde el primer contenedor.
// ──────────────────────────────────────────────────────────────

// Clientes semilla — 15 documentos (nacionales e internacionales)
if (avsa.customer.countDocuments() === 0) {
    avsa.customer.insertMany([
        {
            codigo: 'CLI-001', razonSocial: 'Agroindustrias del Sur S.A.C.',
            ruc: '20512345678', tipoDocumento: 'RUC', numeroDocumento: '20512345678',
            pais: 'Perú', ciudad: 'Lima', direccion: 'Av. La Marina 1234',
            telefono: '01-4567890', email: 'ventas@agroindsur.pe',
            contactoPrincipal: 'Luis Paredes', tipoCliente: 'NACIONAL',
            state: 'A', active: true, createdAt: new Date()
        },
        {
            codigo: 'CLI-002', razonSocial: 'Fresh Fruits Export Ltd.',
            tipoDocumento: 'TAX_ID', numeroDocumento: 'US-987654321',
            pais: 'Estados Unidos', ciudad: 'Miami', direccion: '1200 Brickell Ave',
            telefono: '+1-305-1234567', email: 'imports@freshfruits.com',
            contactoPrincipal: 'John Smith', tipoCliente: 'INTERNACIONAL',
            state: 'A', active: true, createdAt: new Date()
        },
        {
            codigo: 'CLI-003', razonSocial: 'Supermercados Peruanos S.A.',
            ruc: '20101234567', tipoDocumento: 'RUC', numeroDocumento: '20101234567',
            pais: 'Perú', ciudad: 'Lima', direccion: 'Calle Morelli 181 San Borja',
            telefono: '01-6180000', email: 'compras@spsa.pe',
            contactoPrincipal: 'Martha Gutiérrez', tipoCliente: 'NACIONAL',
            state: 'A', active: true, createdAt: new Date()
        },
        {
            codigo: 'CLI-004', razonSocial: 'European Organic Traders GmbH',
            tipoDocumento: 'TAX_ID', numeroDocumento: 'DE-123456789',
            pais: 'Alemania', ciudad: 'Hamburgo', direccion: 'Hafenstraße 45',
            telefono: '+49-40-12345', email: 'procurement@eot.de',
            contactoPrincipal: 'Hans Mueller', tipoCliente: 'INTERNACIONAL',
            state: 'A', active: true, createdAt: new Date()
        },
        {
            codigo: 'CLI-005', razonSocial: 'Mercado Mayorista Cañete E.I.R.L.',
            ruc: '20567890123', tipoDocumento: 'RUC', numeroDocumento: '20567890123',
            pais: 'Perú', ciudad: 'Cañete', direccion: 'Jr. Bolognesi 456',
            telefono: '01-5812345', email: 'info@mercadocanete.pe',
            contactoPrincipal: 'Rosa Mendoza', tipoCliente: 'NACIONAL',
            state: 'A', active: true, createdAt: new Date()
        },
        {
            // Importadora chilena especializada en frutas del valle
            codigo: 'CLI-006', razonSocial: 'Frutas Andinas Importadora Ltda.',
            tipoDocumento: 'RUT', numeroDocumento: 'CL-76543210',
            pais: 'Chile', ciudad: 'Santiago', direccion: 'Av. Providencia 2350',
            telefono: '+56-2-23456789', email: 'compras@frutasandinas.cl',
            contactoPrincipal: 'Valentina Rojas', tipoCliente: 'INTERNACIONAL',
            state: 'A', active: true, createdAt: new Date()
        },
        {
            // Cadena de hoteles que compra productos frescos directamente
            codigo: 'CLI-007', razonSocial: 'Grupo Hotelero Costa Verde S.A.',
            ruc: '20334455667', tipoDocumento: 'RUC', numeroDocumento: '20334455667',
            pais: 'Perú', ciudad: 'Lima', direccion: 'Malecón de la Reserva 610 Miraflores',
            telefono: '01-6108000', email: 'abastecimiento@costaverde.pe',
            contactoPrincipal: 'Jorge Villanueva', tipoCliente: 'NACIONAL',
            state: 'A', active: true, createdAt: new Date()
        },
        {
            // Distribuidor canadiense de productos orgánicos certificados
            codigo: 'CLI-008', razonSocial: 'Pacific Organic Distribution Inc.',
            tipoDocumento: 'TAX_ID', numeroDocumento: 'CA-556677889',
            pais: 'Canadá', ciudad: 'Vancouver', direccion: '789 Pacific Blvd',
            telefono: '+1-604-9876543', email: 'orders@pacificorganic.ca',
            contactoPrincipal: 'Emily Zhang', tipoCliente: 'INTERNACIONAL',
            state: 'A', active: true, createdAt: new Date()
        },
        {
            // Cooperativa de productores locales que también compra para reventa
            codigo: 'CLI-009', razonSocial: 'Cooperativa Agraria Valle Cañete',
            ruc: '20123456780', tipoDocumento: 'RUC', numeroDocumento: '20123456780',
            pais: 'Perú', ciudad: 'Cañete', direccion: 'Panamericana Sur Km 146',
            telefono: '01-5814400', email: 'gerencia@coopvallecanete.pe',
            contactoPrincipal: 'Félix Quispe Mamani', tipoCliente: 'NACIONAL',
            state: 'A', active: true, createdAt: new Date()
        },
        {
            // Cadena española que importa espárragos y paltas peruanas
            codigo: 'CLI-010', razonSocial: 'Importaciones Ibéricas S.L.',
            tipoDocumento: 'NIF', numeroDocumento: 'ES-B12345678',
            pais: 'España', ciudad: 'Madrid', direccion: 'Calle Serrano 55',
            telefono: '+34-91-1234567', email: 'importaciones@ibericas.es',
            contactoPrincipal: 'Carlos Fernández', tipoCliente: 'INTERNACIONAL',
            state: 'A', active: true, createdAt: new Date()
        },
        {
            // Empresa procesadora de jugos naturales en Lima
            codigo: 'CLI-011', razonSocial: 'Procesadora de Jugos Naturales del Perú S.A.C.',
            ruc: '20456789012', tipoDocumento: 'RUC', numeroDocumento: '20456789012',
            pais: 'Perú', ciudad: 'Lima', direccion: 'Av. Naranjal 1560 Independencia',
            telefono: '01-5312200', email: 'logistica@jugosnaturales.pe',
            contactoPrincipal: 'Natalia Espinoza', tipoCliente: 'NACIONAL',
            state: 'A', active: true, createdAt: new Date()
        },
        {
            // Importador japonés de frutas exóticas de Sudamérica
            codigo: 'CLI-012', razonSocial: 'Nippon Fresh Foods Co. Ltd.',
            tipoDocumento: 'TAX_ID', numeroDocumento: 'JP-1234567890',
            pais: 'Japón', ciudad: 'Tokio', direccion: '2-1 Tsukiji Chuo-ku',
            telefono: '+81-3-55551234', email: 'import@nipponfresh.co.jp',
            contactoPrincipal: 'Hiroshi Tanaka', tipoCliente: 'INTERNACIONAL',
            state: 'A', active: true, createdAt: new Date()
        },
        {
            // Restaurante de alta cocina en Miraflores que compra directo al productor
            codigo: 'CLI-013', razonSocial: 'Restaurante Central Andino E.I.R.L.',
            ruc: '20234567891', tipoDocumento: 'RUC', numeroDocumento: '20234567891',
            pais: 'Perú', ciudad: 'Lima', direccion: 'Av. Pedro de Osma 301 Barranco',
            telefono: '01-4418978', email: 'compras@centralandino.pe',
            contactoPrincipal: 'Sofía Alvarado', tipoCliente: 'NACIONAL',
            state: 'A', active: true, createdAt: new Date()
        },
        {
            // Distribuidor holandés, hub para toda Europa
            codigo: 'CLI-014', razonSocial: 'Dutch Agri Trade B.V.',
            tipoDocumento: 'TAX_ID', numeroDocumento: 'NL-987654321B01',
            pais: 'Países Bajos', ciudad: 'Rotterdam', direccion: 'Waalhaven Z.Z. 15',
            telefono: '+31-10-4123456', email: 'trading@dutchagri.nl',
            contactoPrincipal: 'Pieter van Dijk', tipoCliente: 'INTERNACIONAL',
            state: 'A', active: true, createdAt: new Date()
        },
        {
            // Empresa arequipeña que abastece mercados del sur del Perú
            codigo: 'CLI-015', razonSocial: 'Distribuidora Sur Andino S.R.L.',
            ruc: '20678901234', tipoDocumento: 'RUC', numeroDocumento: '20678901234',
            pais: 'Perú', ciudad: 'Arequipa', direccion: 'Av. Ejercito 205',
            telefono: '054-234567', email: 'ventas@surandino.pe',
            contactoPrincipal: 'Miguel Cáceres Vargas', tipoCliente: 'NACIONAL',
            state: 'A', active: true, createdAt: new Date()
        }
    ]);
    print('[INFO] customer: 15 documentos insertados.');
} else {
    print('[INFO] customer ya tiene datos — seed omitido.');
}

// Productos semilla — 15 documentos (catálogo agrícola del valle de Cañete)
if (avsa.productos.countDocuments() === 0) {
    avsa.productos.insertMany([
        {
            codigo: 'PROD-001', nombre: 'Mandarina Satsuma',
            descripcion: 'Mandarina variedad Satsuma de primera calidad, sin semillas',
            categoria: 'Cítricos', unidadMedida: 'Caja',
            precioUnitario: NumberDecimal('85.00'), stockActual: 500, stockMinimo: 50,
            origen: 'Cañete - San Vicente', estado: true, createdAt: new Date()
        },
        {
            codigo: 'PROD-002', nombre: 'Palta Hass',
            descripcion: 'Palta Hass calibre 16-20, lista para exportación',
            categoria: 'Frutas', unidadMedida: 'Caja',
            precioUnitario: NumberDecimal('120.00'), stockActual: 350, stockMinimo: 40,
            origen: 'Cañete - Lunahuaná', estado: true, createdAt: new Date()
        },
        {
            codigo: 'PROD-003', nombre: 'Uva Red Globe',
            descripcion: 'Uva de mesa variedad Red Globe, racimos uniformes',
            categoria: 'Frutas', unidadMedida: 'Caja',
            precioUnitario: NumberDecimal('95.00'), stockActual: 280, stockMinimo: 30,
            origen: 'Cañete - Imperial', estado: true, createdAt: new Date()
        },
        {
            codigo: 'PROD-004', nombre: 'Espárrago Verde',
            descripcion: 'Espárrago verde fresco calibre jumbo para exportación',
            categoria: 'Hortalizas', unidadMedida: 'Kg',
            precioUnitario: NumberDecimal('18.50'), stockActual: 1200, stockMinimo: 100,
            origen: 'Cañete - Quilmaná', estado: true, createdAt: new Date()
        },
        {
            codigo: 'PROD-005', nombre: 'Mango Kent',
            descripcion: 'Mango variedad Kent calibre 8-10, pulpa firme',
            categoria: 'Frutas', unidadMedida: 'Caja',
            precioUnitario: NumberDecimal('110.00'), stockActual: 420, stockMinimo: 50,
            origen: 'Cañete - San Vicente', estado: true, createdAt: new Date()
        },
        {
            // Variedad de uva sin semillas muy demandada en mercados asiáticos
            codigo: 'PROD-006', nombre: 'Uva Thompson Seedless',
            descripcion: 'Uva blanca sin semillas, calibre 16-17 mm',
            categoria: 'Frutas', unidadMedida: 'Caja',
            precioUnitario: NumberDecimal('88.00'), stockActual: 190, stockMinimo: 25,
            origen: 'Cañete - Imperial', estado: true, createdAt: new Date()
        },
        {
            // Limón sutil, el más usado en la gastronomía peruana
            codigo: 'PROD-007', nombre: 'Limón Sutil',
            descripcion: 'Limón sutil fresco, tamaño mediano, alta acidez',
            categoria: 'Cítricos', unidadMedida: 'Saco',
            precioUnitario: NumberDecimal('45.00'), stockActual: 600, stockMinimo: 80,
            origen: 'Cañete - San Vicente', estado: true, createdAt: new Date()
        },
        {
            // Camote morado, muy buscado por restaurantes de alta cocina
            codigo: 'PROD-008', nombre: 'Camote Morado',
            descripcion: 'Camote morado orgánico, alto contenido de antocianinas',
            categoria: 'Tubérculos', unidadMedida: 'Saco',
            precioUnitario: NumberDecimal('38.00'), stockActual: 800, stockMinimo: 60,
            origen: 'Cañete - Mala', estado: true, createdAt: new Date()
        },
        {
            // Granada, producto de nicho con alta demanda en Europa
            codigo: 'PROD-009', nombre: 'Granada Wonderful',
            descripcion: 'Granada variedad Wonderful, alta concentración de jugo',
            categoria: 'Frutas', unidadMedida: 'Caja',
            precioUnitario: NumberDecimal('135.00'), stockActual: 150, stockMinimo: 20,
            origen: 'Cañete - Lunahuaná', estado: true, createdAt: new Date()
        },
        {
            // Maíz morado, materia prima para chicha morada y colorante natural
            codigo: 'PROD-010', nombre: 'Maíz Morado',
            descripcion: 'Maíz morado seco, variedad Carazas, usado para chicha y colorante',
            categoria: 'Granos', unidadMedida: 'Saco',
            precioUnitario: NumberDecimal('55.00'), stockActual: 950, stockMinimo: 100,
            origen: 'Cañete - Quilmaná', estado: true, createdAt: new Date()
        },
        {
            // Pacay, fruta tropical típica de la costa peruana
            codigo: 'PROD-011', nombre: 'Pacay',
            descripcion: 'Pacay fresco vainas grandes, pulpa dulce y esponjosa',
            categoria: 'Frutas', unidadMedida: 'Kg',
            precioUnitario: NumberDecimal('12.00'), stockActual: 300, stockMinimo: 30,
            origen: 'Cañete - San Vicente', estado: true, createdAt: new Date()
        },
        {
            // Ají amarillo, base de la gastronomía peruana
            codigo: 'PROD-012', nombre: 'Ají Amarillo',
            descripcion: 'Ají amarillo fresco, calibre export, color uniforme',
            categoria: 'Hortalizas', unidadMedida: 'Caja',
            precioUnitario: NumberDecimal('62.00'), stockActual: 220, stockMinimo: 25,
            origen: 'Cañete - Mala', estado: true, createdAt: new Date()
        },
        {
            // Choclo blanco gigante del Cusco, pero también se cultiva en Cañete
            codigo: 'PROD-013', nombre: 'Choclo Blanco Gigante',
            descripcion: 'Choclo blanco tierno variedad Cusco, grano grande y dulce',
            categoria: 'Granos', unidadMedida: 'Saco',
            precioUnitario: NumberDecimal('48.00'), stockActual: 400, stockMinimo: 40,
            origen: 'Cañete - Lunahuaná', estado: true, createdAt: new Date()
        },
        {
            // Sandía, producto estacional de alta rotación en verano
            codigo: 'PROD-014', nombre: 'Sandía Crimson Sweet',
            descripcion: 'Sandía sin semillas variedad Crimson Sweet, pulpa roja firme',
            categoria: 'Frutas', unidadMedida: 'Unidad',
            precioUnitario: NumberDecimal('22.00'), stockActual: 350, stockMinimo: 30,
            origen: 'Cañete - San Vicente', estado: true, createdAt: new Date()
        },
        {
            // Aceituna, cultivo tradicional del litoral peruano
            codigo: 'PROD-015', nombre: 'Aceituna Botija',
            descripcion: 'Aceituna botija negra curada en sal, calibre extra',
            categoria: 'Otros', unidadMedida: 'Balde',
            precioUnitario: NumberDecimal('75.00'), stockActual: 180, stockMinimo: 20,
            origen: 'Cañete - Quilmaná', estado: true, createdAt: new Date()
        }
    ]);
    print('[INFO] productos: 15 documentos insertados.');
} else {
    print('[INFO] productos ya tiene datos — seed omitido.');
}

// Agroquímicos semilla — 15 documentos (todas las categorías SENASA)
if (avsa.agrochemicals.countDocuments() === 0) {
    avsa.agrochemicals.insertMany([
        {
            commercialName: 'Roundup Max', activeIngredient: 'Glifosato 74.7%',
            category: 'HERBICIDE', senasaRegistrationNumber: 'SEN-2024-001',
            registrationExpiry: new Date('2026-12-31'), maxDose: NumberDecimal('2.5'),
            waitingPeriodDays: 15, manufacturer: 'Bayer CropScience',
            active: true, createdAt: new Date()
        },
        {
            commercialName: 'Karate Zeon', activeIngredient: 'Lambda-Cialotrina 5%',
            category: 'INSECTICIDE', senasaRegistrationNumber: 'SEN-2024-002',
            registrationExpiry: new Date('2027-06-30'), maxDose: NumberDecimal('1.5'),
            waitingPeriodDays: 21, manufacturer: 'Syngenta',
            active: true, createdAt: new Date()
        },
        {
            commercialName: 'Score 250 EC', activeIngredient: 'Difenoconazol 25%',
            category: 'FUNGICIDE', senasaRegistrationNumber: 'SEN-2024-003',
            registrationExpiry: new Date('2026-09-15'), maxDose: NumberDecimal('0.5'),
            waitingPeriodDays: 14, manufacturer: 'Syngenta',
            active: true, createdAt: new Date()
        },
        {
            commercialName: 'Bayfolan Forte', activeIngredient: 'NPK + Microelementos',
            category: 'FERTILIZER', senasaRegistrationNumber: 'SEN-2024-004',
            registrationExpiry: new Date('2027-05-01'), maxDose: NumberDecimal('5.0'),
            waitingPeriodDays: 0, manufacturer: 'Bayer CropScience',
            active: true, createdAt: new Date()
        },
        {
            commercialName: 'Trichoderma Harzianum', activeIngredient: 'Trichoderma harzianum',
            category: 'BIOSTIMULANT', senasaRegistrationNumber: 'SEN-2024-005',
            registrationExpiry: new Date('2029-01-15'), maxDose: NumberDecimal('2.0'),
            waitingPeriodDays: 0, manufacturer: 'BioAgro Peru',
            active: true, createdAt: new Date()
        },
        {
            // Insecticida sistémico muy usado en frutales contra pulgones
            commercialName: 'Confidor 350 SC', activeIngredient: 'Imidacloprid 35%',
            category: 'INSECTICIDE', senasaRegistrationNumber: 'SEN-2024-006',
            registrationExpiry: new Date('2027-03-20'), maxDose: NumberDecimal('0.8'),
            waitingPeriodDays: 14, manufacturer: 'Bayer CropScience',
            active: true, createdAt: new Date()
        },
        {
            // Fungicida preventivo y curativo de amplio espectro
            commercialName: 'Amistar Top', activeIngredient: 'Azoxystrobin 20% + Difenoconazol 12.5%',
            category: 'FUNGICIDE', senasaRegistrationNumber: 'SEN-2024-007',
            registrationExpiry: new Date('2028-02-28'), maxDose: NumberDecimal('1.0'),
            waitingPeriodDays: 21, manufacturer: 'Syngenta',
            active: true, createdAt: new Date()
        },
        {
            // Herbicida selectivo para gramíneas en cultivos de espárrago
            commercialName: 'Fusilade Forte', activeIngredient: 'Fluazifop-p-butil 12.5%',
            category: 'HERBICIDE', senasaRegistrationNumber: 'SEN-2024-008',
            registrationExpiry: new Date('2026-08-10'), maxDose: NumberDecimal('1.5'),
            waitingPeriodDays: 30, manufacturer: 'Syngenta',
            active: true, createdAt: new Date()
        },
        {
            // Fertilizante foliar para engorde de frutos en etapa de llenado
            commercialName: 'Wuxal Calcio-Boro', activeIngredient: 'Calcio 7% + Boro 0.5%',
            category: 'FERTILIZER', senasaRegistrationNumber: 'SEN-2024-009',
            registrationExpiry: new Date('2028-11-30'), maxDose: NumberDecimal('3.0'),
            waitingPeriodDays: 0, manufacturer: 'COMPO Expert',
            active: true, createdAt: new Date()
        },
        {
            // Insecticida biológico a base de Bacillus, compatible con abejas
            commercialName: 'Dipel DF', activeIngredient: 'Bacillus thuringiensis var. kurstaki 54%',
            category: 'INSECTICIDE', senasaRegistrationNumber: 'SEN-2024-010',
            registrationExpiry: new Date('2027-09-12'), maxDose: NumberDecimal('1.0'),
            waitingPeriodDays: 0, manufacturer: 'Sumitomo Chemical',
            active: true, createdAt: new Date()
        },
        {
            // Fungicida cúprico clásico para control de enfermedades bacterianas
            commercialName: 'Kocide 2000', activeIngredient: 'Hidróxido de cobre 53.8%',
            category: 'FUNGICIDE', senasaRegistrationNumber: 'SEN-2024-011',
            registrationExpiry: new Date('2026-06-30'), maxDose: NumberDecimal('2.0'),
            waitingPeriodDays: 7, manufacturer: 'FMC Corporation',
            active: true, createdAt: new Date()
        },
        {
            // Regulador de crecimiento para mejorar calibre en uva de mesa
            commercialName: 'Progibb 40 SG', activeIngredient: 'Ácido Giberélico 40%',
            category: 'BIOSTIMULANT', senasaRegistrationNumber: 'SEN-2024-012',
            registrationExpiry: new Date('2028-04-15'), maxDose: NumberDecimal('0.02'),
            waitingPeriodDays: 0, manufacturer: 'Valent BioSciences',
            active: true, createdAt: new Date()
        },
        {
            // Herbicida preemergente para control de malezas anuales
            commercialName: 'Stomp Aqua', activeIngredient: 'Pendimetalina 45.5%',
            category: 'HERBICIDE', senasaRegistrationNumber: 'SEN-2024-013',
            registrationExpiry: new Date('2027-01-20'), maxDose: NumberDecimal('3.5'),
            waitingPeriodDays: 45, manufacturer: 'BASF',
            active: true, createdAt: new Date()
        },
        {
            // Acaricida para control de arañita roja en cítricos y uva
            commercialName: 'Vertimec 1.8 EC', activeIngredient: 'Abamectina 1.8%',
            category: 'INSECTICIDE', senasaRegistrationNumber: 'SEN-2024-014',
            registrationExpiry: new Date('2027-10-05'), maxDose: NumberDecimal('1.0'),
            waitingPeriodDays: 7, manufacturer: 'Syngenta',
            active: true, createdAt: new Date()
        },
        {
            // Fertilizante con potasio para mejorar dulzor y color en frutas
            commercialName: 'Sulpomag', activeIngredient: 'Sulfato de potasio y magnesio 22-11',
            category: 'FERTILIZER', senasaRegistrationNumber: 'SEN-2024-015',
            registrationExpiry: new Date('2029-07-31'), maxDose: NumberDecimal('8.0'),
            waitingPeriodDays: 0, manufacturer: 'K+S Minerals',
            active: true, createdAt: new Date()
        }
    ]);
    print('[INFO] agrochemicals: 15 documentos insertados.');
} else {
    print('[INFO] agrochemicals ya tiene datos — seed omitido.');
}

// Notificaciones semilla — 15 documentos (distintos módulos y estados)
if (avsa.notificaciones.countDocuments() === 0) {
    avsa.notificaciones.insertMany([
        {
            tipo: 'CREATE', modulo: 'CLIENTE',
            mensaje: 'Nuevo cliente registrado: Agroindustrias del Sur S.A.C.',
            usuario: 'admin', entidadId: 1,
            detalle: 'Cliente CLI-001 creado exitosamente',
            fechaHora: new Date(), estado: 'NO_LEIDA'
        },
        {
            tipo: 'CREATE', modulo: 'AGROQUIMICO',
            mensaje: 'Agroquímico Roundup Max registrado en el sistema',
            usuario: 'admin', entidadId: 1,
            detalle: 'Agroquímico con registro SENASA SEN-2024-001',
            fechaHora: new Date(), estado: 'NO_LEIDA'
        },
        {
            tipo: 'UPDATE', modulo: 'PRODUCTO',
            mensaje: 'Stock actualizado: Mandarina Satsuma',
            usuario: 'logistica1', entidadId: 1,
            detalle: 'Stock actualizado a 500 unidades',
            fechaHora: new Date(), estado: 'LEIDA'
        },
        {
            // Alerta de vencimiento de registro SENASA próximo
            tipo: 'ALERT', modulo: 'SENASA',
            mensaje: 'Registro SENASA próximo a vencer: Score 250 EC',
            usuario: 'sistema', entidadId: 3,
            detalle: 'El registro SEN-2024-003 vence el 2026-09-15. Renovar antes de esa fecha.',
            fechaHora: new Date(), estado: 'NO_LEIDA'
        },
        {
            // Notificación de stock bajo en un producto
            tipo: 'ALERT', modulo: 'INVENTARIO',
            mensaje: 'Stock mínimo alcanzado: Uva Red Globe',
            usuario: 'sistema', entidadId: 3,
            detalle: 'Stock actual (280 cajas) está cerca del mínimo definido (30 cajas).',
            fechaHora: new Date(), estado: 'NO_LEIDA'
        },
        {
            // Registro de una nueva aplicación en campo
            tipo: 'CREATE', modulo: 'APLICACION',
            mensaje: 'Nueva aplicación de campo registrada en Parcela Norte Santa Rosa',
            usuario: 'tech_juan', entidadId: 1,
            detalle: 'Aplicación de Confidor 350 SC a 0.40 L/ha en mandarina',
            fechaHora: new Date(), estado: 'LEIDA'
        },
        {
            // Pedido nuevo de un cliente internacional
            tipo: 'CREATE', modulo: 'PEDIDO',
            mensaje: 'Nuevo pedido recibido de Fresh Fruits Export Ltd.',
            usuario: 'admin', entidadId: 2,
            detalle: 'Pedido PED-2026-001 por S/. 4,250.00 en estado CONFIRMADO',
            fechaHora: new Date(), estado: 'NO_LEIDA'
        },
        {
            // Actualización de datos de un cliente
            tipo: 'UPDATE', modulo: 'CLIENTE',
            mensaje: 'Datos actualizados: Supermercados Peruanos S.A.',
            usuario: 'supervisor1', entidadId: 3,
            detalle: 'Actualizado teléfono y correo de contacto principal',
            fechaHora: new Date(), estado: 'LEIDA'
        },
        {
            // Dosis excedida detectada por el sistema automático
            tipo: 'ALERT', modulo: 'SENASA',
            mensaje: 'Dosis excedida detectada: Karate Zeon en Campo Principal Valle',
            usuario: 'sistema', entidadId: 2,
            detalle: 'La dosis aplicada (2.0 L/ha) supera el máximo SENASA (1.5 L/ha). Revisar.',
            fechaHora: new Date(), estado: 'NO_LEIDA'
        },
        {
            // Nuevo productor incorporado al sistema
            tipo: 'CREATE', modulo: 'PRODUCTOR',
            mensaje: 'Nuevo productor registrado: José Luis Quispe Mamani',
            usuario: 'supervisor1', entidadId: 3,
            detalle: 'Productor de Lunahuaná incorporado con QR-PROD-003',
            fechaHora: new Date(), estado: 'LEIDA'
        },
        {
            // Entrega de agroquímicos completada
            tipo: 'CREATE', modulo: 'ENTREGA',
            mensaje: 'Entrega de inventario completada para Roberto Sánchez',
            usuario: 'logistica1', entidadId: 1,
            detalle: '10 L de Confidor 350 SC entregados en Fundo Santa Rosa',
            fechaHora: new Date(), estado: 'LEIDA'
        },
        {
            // Alerta de registro SENASA ya vencido
            tipo: 'ALERT', modulo: 'SENASA',
            mensaje: 'Registro SENASA VENCIDO: Kocide 2000',
            usuario: 'sistema', entidadId: 11,
            detalle: 'El registro SEN-2024-011 venció el 2026-06-30. No debe aplicarse.',
            fechaHora: new Date(), estado: 'NO_LEIDA'
        },
        {
            // Pedido actualizado a estado EN_PROCESO
            tipo: 'UPDATE', modulo: 'PEDIDO',
            mensaje: 'Pedido PED-2026-001 actualizado a EN_PROCESO',
            usuario: 'logistica1', entidadId: 1,
            detalle: 'El pedido de Fresh Fruits Export está siendo preparado para despacho',
            fechaHora: new Date(), estado: 'NO_LEIDA'
        },
        {
            // Nuevo agroquímico registrado por el área de certificaciones
            tipo: 'CREATE', modulo: 'AGROQUIMICO',
            mensaje: 'Agroquímico Sulpomag agregado al catálogo',
            usuario: 'cert_ana', entidadId: 15,
            detalle: 'Fertilizante potásico registrado con número SEN-2024-015',
            fechaHora: new Date(), estado: 'LEIDA'
        },
        {
            // Reporte de lote cerrado al final de campaña
            tipo: 'UPDATE', modulo: 'LOTE',
            mensaje: 'Lote LOT-2026-003 cerrado al finalizar campaña de espárrago',
            usuario: 'supervisor1', entidadId: 3,
            detalle: 'Campaña espárrago Quilmaná finalizada. Producción total: 5,400 Kg.',
            fechaHora: new Date(), estado: 'LEIDA'
        }
    ]);
    print('[INFO] notificaciones: 15 documentos insertados.');
} else {
    print('[INFO] notificaciones ya tiene datos — seed omitido.');
}

// ──────────────────────────────────────────────────────────────
// 4. TABLA DE CONTROL DE VERSIONES
// Registra los cambios aplicados, igual que schema_change en
// SQL Server. El run.sh escribe aquí después de cada script.
// ──────────────────────────────────────────────────────────────
avsa.createCollection('schema_changes', {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['sequence', 'changeId', 'checksum', 'gitSha', 'releaseVersion', 'appliedAt'],
            properties: {
                sequence:       { bsonType: 'int' },
                changeId:       { bsonType: 'string' },
                checksum:       { bsonType: 'string' },
                gitSha:         { bsonType: 'string' },
                releaseVersion: { bsonType: 'string' },
                appliedAt:      { bsonType: 'date' }
            }
        }
    },
    validationLevel: 'strict',
    validationAction: 'error'
});
avsa.schema_changes.createIndex({ sequence: 1 }, { unique: true, name: 'uq_change_sequence' });
avsa.schema_changes.createIndex({ changeId: 1 }, { unique: true, name: 'uq_change_id' });
print('[INFO] Colección schema_changes creada con índices únicos.');

print('[SUCCESS] Baseline V001 ejecutado correctamente — db_avsa lista.');
