// =============================================================================
// SEED DATA - AVSA S4 MongoDB (db_avsa)
// Colecciones: customers, products, agrochemicals
// Autor: Pierre Alexis Conca Flores
//
// CÓMO EJECUTAR:
//   1. Abrir MongoDB Compass
//   2. Conectarse al cluster: cluster0.kt6pnki.mongodb.net
//   3. Seleccionar la base de datos: db_avsa
//   4. Abrir el panel "MongoShell" (abajo) o ir a una colección → Aggregations → MongoShell
//   5. Pegar y ejecutar este script completo
// =============================================================================

// ─────────────────────────────────────────────────────────────────────────────
// 1. CUSTOMERS (15 registros)
// ─────────────────────────────────────────────────────────────────────────────
const customersToInsert = [
  { code: "CLI-001", businessName: "Agroindustrias del Sur S.A.C.",      ruc: "20512345678", documentType: "RUC",    documentNumber: "20512345678", country: "Perú",           city: "Lima",      address: "Av. La Marina 1234",        phone: "01-4567890",     email: "ventas@agroindsur.pe",       primaryContact: "Luis Paredes",    customerType: "NACIONAL",      state: "A", active: true,  createdAt: new Date() },
  { code: "CLI-002", businessName: "Fresh Fruits Export Ltd.",            ruc: null,          documentType: "TAX_ID", documentNumber: "US-987654321", country: "Estados Unidos", city: "Miami",     address: "1200 Brickell Ave",          phone: "+1-305-1234567", email: "imports@freshfruits.com",    primaryContact: "John Smith",      customerType: "INTERNACIONAL", state: "A", active: true,  createdAt: new Date() },
  { code: "CLI-003", businessName: "Supermercados Peruanos S.A.",         ruc: "20101234567", documentType: "RUC",    documentNumber: "20101234567", country: "Perú",           city: "Lima",      address: "Calle Morelli 181",          phone: "01-6180000",     email: "compras@spsa.pe",            primaryContact: "Martha Gutiérrez",customerType: "NACIONAL",      state: "A", active: true,  createdAt: new Date() },
  { code: "CLI-004", businessName: "European Organic Traders GmbH",       ruc: null,          documentType: "TAX_ID", documentNumber: "DE-123456789", country: "Alemania",       city: "Hamburgo",  address: "Hafenstraße 45",             phone: "+49-40-12345",   email: "procurement@eot.de",         primaryContact: "Hans Mueller",    customerType: "INTERNACIONAL", state: "A", active: true,  createdAt: new Date() },
  { code: "CLI-005", businessName: "Mercado Mayorista Cañete E.I.R.L.",   ruc: "20567890123", documentType: "RUC",    documentNumber: "20567890123", country: "Perú",           city: "Cañete",    address: "Jr. Bolognesi 456",          phone: "01-5812345",     email: "info@mercadocanete.pe",      primaryContact: "Rosa Mendoza",    customerType: "NACIONAL",      state: "A", active: true,  createdAt: new Date() },
  { code: "CLI-006", businessName: "Asia Pacific Foods Co.",               ruc: null,          documentType: "TAX_ID", documentNumber: "JP-456789012", country: "Japón",          city: "Tokio",     address: "Chiyoda-ku 3-1-1",           phone: "+81-3-1234567",  email: "buy@apfoods.jp",             primaryContact: "Yuki Tanaka",     customerType: "INTERNACIONAL", state: "A", active: true,  createdAt: new Date() },
  { code: "CLI-007", businessName: "Distribuidora Agrícola Lima S.A.C.",  ruc: "20234567890", documentType: "RUC",    documentNumber: "20234567890", country: "Perú",           city: "Lima",      address: "Av. Argentina 2345",         phone: "01-3456789",     email: "pedidos@distagri.pe",        primaryContact: "Carlos Vega",     customerType: "NACIONAL",      state: "A", active: true,  createdAt: new Date() },
  { code: "CLI-008", businessName: "Canadian Harvest Imports Inc.",        ruc: null,          documentType: "TAX_ID", documentNumber: "CA-789012345", country: "Canadá",         city: "Toronto",   address: "100 Queen St West",          phone: "+1-416-9876543", email: "sourcing@canharvest.ca",     primaryContact: "Emma Wilson",     customerType: "INTERNACIONAL", state: "A", active: true,  createdAt: new Date() },
  { code: "CLI-009", businessName: "Cooperativa Agraria Cañete",          ruc: "20345678901", documentType: "RUC",    documentNumber: "20345678901", country: "Perú",           city: "Cañete",    address: "Av. Mariscal Benavides 789", phone: "01-5813456",     email: "cooperativa@coopcanete.pe", primaryContact: "Jorge Salinas",   customerType: "NACIONAL",      state: "A", active: true,  createdAt: new Date() },
  { code: "CLI-010", businessName: "UK Fresh Produce Ltd.",                ruc: null,          documentType: "TAX_ID", documentNumber: "GB-321654987", country: "Reino Unido",    city: "Londres",   address: "10 Downing Market",          phone: "+44-20-7654321", email: "orders@ukfresh.co.uk",       primaryContact: "James Brown",     customerType: "INTERNACIONAL", state: "A", active: true,  createdAt: new Date() },
  { code: "CLI-011", businessName: "Restaurant Chain Peru S.A.C.",        ruc: "20456789012", documentType: "RUC",    documentNumber: "20456789012", country: "Perú",           city: "Lima",      address: "Av. Javier Prado 567",       phone: "01-2345678",     email: "compras@restchain.pe",       primaryContact: "Andrea Paz",      customerType: "NACIONAL",      state: "A", active: true,  createdAt: new Date() },
  { code: "CLI-012", businessName: "Chilean Agricultural Trading SpA",    ruc: null,          documentType: "TAX_ID", documentNumber: "CL-765432109", country: "Chile",          city: "Santiago",  address: "Av. Providencia 1234",       phone: "+56-2-9876543",  email: "imports@chiletrade.cl",      primaryContact: "Pablo Muñoz",     customerType: "INTERNACIONAL", state: "A", active: true,  createdAt: new Date() },
  { code: "CLI-013", businessName: "Exportadora Valle Sur S.A.",          ruc: "20567890234", documentType: "RUC",    documentNumber: "20567890234", country: "Perú",           city: "Ica",       address: "Panamericana Sur Km 300",    phone: "056-234567",     email: "export@vallesur.pe",         primaryContact: "Diana Flores",    customerType: "NACIONAL",      state: "A", active: true,  createdAt: new Date() },
  { code: "CLI-014", businessName: "Netherlands Tropical Fruits BV",       ruc: null,          documentType: "TAX_ID", documentNumber: "NL-876543210", country: "Países Bajos",   city: "Rotterdam", address: "Europoort 789",              phone: "+31-10-1234567", email: "purchase@nltropical.nl",     primaryContact: "Pieter van Dijk", customerType: "INTERNACIONAL", state: "A", active: true,  createdAt: new Date() },
  { code: "CLI-015", businessName: "Agrícola Don Bosco S.A.C.",           ruc: "20678901234", documentType: "RUC",    documentNumber: "20678901234", country: "Perú",           city: "Lima",      address: "Av. Colonial 3456",          phone: "01-5678901",     email: "gerencia@donboscoagri.pe",  primaryContact: "Manuel Ríos",     customerType: "NACIONAL",      state: "I", active: false, createdAt: new Date(), deletedAt: new Date() },
];

let insertedCustomers = 0;
customersToInsert.forEach(doc => {
  const exists = db.customers.findOne({ code: doc.code });
  if (!exists) { db.customers.insertOne(doc); insertedCustomers++; }
});
print(`✅ customers: ${insertedCustomers} insertados (${db.customers.countDocuments()} total)`);

// ─────────────────────────────────────────────────────────────────────────────
// 2. PRODUCTS (15 registros)
// ─────────────────────────────────────────────────────────────────────────────
const productsToInsert = [
  { code: "PROD-001", name: "Mandarina Satsuma",  category: "Cítricos",   description: "Mandarina variedad Satsuma de primera calidad",   unitMeasure: "Caja",      unitPrice: NumberDecimal("85.00"),  currentStock: 500,  minimumStock: 50,  origin: "Cañete - San Vicente",    active: true,  createdAt: new Date() },
  { code: "PROD-002", name: "Palta Hass",          category: "Frutas",     description: "Palta Hass calibre 16-20",                        unitMeasure: "Caja",      unitPrice: NumberDecimal("120.00"), currentStock: 350,  minimumStock: 40,  origin: "Cañete - Lunahuaná",      active: true,  createdAt: new Date() },
  { code: "PROD-003", name: "Uva Red Globe",       category: "Frutas",     description: "Uva de mesa variedad Red Globe",                  unitMeasure: "Caja",      unitPrice: NumberDecimal("95.00"),  currentStock: 280,  minimumStock: 30,  origin: "Cañete - Imperial",       active: true,  createdAt: new Date() },
  { code: "PROD-004", name: "Espárrago Verde",     category: "Hortalizas", description: "Espárrago verde fresco para exportación",         unitMeasure: "Kg",        unitPrice: NumberDecimal("18.50"),  currentStock: 1200, minimumStock: 100, origin: "Cañete - Quilmaná",       active: true,  createdAt: new Date() },
  { code: "PROD-005", name: "Camote Amarillo",     category: "Tubérculos", description: "Camote amarillo tipo exportación",                unitMeasure: "Saco",      unitPrice: NumberDecimal("45.00"),  currentStock: 600,  minimumStock: 60,  origin: "Cañete - Cerro Azul",     active: true,  createdAt: new Date() },
  { code: "PROD-006", name: "Mango Kent",          category: "Frutas",     description: "Mango variedad Kent calibre 8-10",                unitMeasure: "Caja",      unitPrice: NumberDecimal("110.00"), currentStock: 420,  minimumStock: 50,  origin: "Cañete - San Vicente",    active: true,  createdAt: new Date() },
  { code: "PROD-007", name: "Maíz Morado",         category: "Granos",     description: "Maíz morado orgánico",                           unitMeasure: "Saco",      unitPrice: NumberDecimal("65.00"),  currentStock: 300,  minimumStock: 30,  origin: "Cañete - Nuevo Imperial", active: true,  createdAt: new Date() },
  { code: "PROD-008", name: "Algodón Tangüis",     category: "Fibras",     description: "Algodón Tangüis fibra larga",                    unitMeasure: "Quintal",   unitPrice: NumberDecimal("250.00"), currentStock: 150,  minimumStock: 20,  origin: "Cañete - San Vicente",    active: true,  createdAt: new Date() },
  { code: "PROD-009", name: "Limón Sutil",         category: "Cítricos",   description: "Limón sutil para industria y mesa",               unitMeasure: "Caja",      unitPrice: NumberDecimal("55.00"),  currentStock: 800,  minimumStock: 80,  origin: "Cañete - Imperial",       active: true,  createdAt: new Date() },
  { code: "PROD-010", name: "Naranja Valencia",    category: "Cítricos",   description: "Naranja Valencia jugo concentrado",               unitMeasure: "Caja",      unitPrice: NumberDecimal("70.00"),  currentStock: 450,  minimumStock: 50,  origin: "Cañete - Quilmaná",       active: true,  createdAt: new Date() },
  { code: "PROD-011", name: "Arándano Biloxi",     category: "Frutas",     description: "Arándano fresco variedad Biloxi",                 unitMeasure: "Clamshell", unitPrice: NumberDecimal("35.00"),  currentStock: 900,  minimumStock: 100, origin: "Cañete - San Vicente",    active: true,  createdAt: new Date() },
  { code: "PROD-012", name: "Quinua Blanca",       category: "Granos",     description: "Quinua blanca orgánica lavada",                  unitMeasure: "Saco",      unitPrice: NumberDecimal("180.00"), currentStock: 200,  minimumStock: 25,  origin: "Cañete - Lunahuaná",      active: true,  createdAt: new Date() },
  { code: "PROD-013", name: "Tomate Cherry",       category: "Hortalizas", description: "Tomate cherry hidropónico",                      unitMeasure: "Kg",        unitPrice: NumberDecimal("12.00"),  currentStock: 650,  minimumStock: 70,  origin: "Cañete - Imperial",       active: true,  createdAt: new Date() },
  { code: "PROD-014", name: "Pimiento Piquillo",   category: "Hortalizas", description: "Pimiento piquillo rojo fresco",                  unitMeasure: "Kg",        unitPrice: NumberDecimal("14.50"),  currentStock: 400,  minimumStock: 40,  origin: "Cañete - Nuevo Imperial", active: true,  createdAt: new Date() },
  { code: "PROD-015", name: "Granadilla",          category: "Frutas",     description: "Granadilla fresca calibre AA",                   unitMeasure: "Caja",      unitPrice: NumberDecimal("90.00"),  currentStock: 250,  minimumStock: 30,  origin: "Cañete - Lunahuaná",      active: false, createdAt: new Date(), deletedAt: new Date() },
];

let insertedProducts = 0;
productsToInsert.forEach(doc => {
  const exists = db.products.findOne({ code: doc.code });
  if (!exists) { db.products.insertOne(doc); insertedProducts++; }
});
print(`✅ products: ${insertedProducts} insertados (${db.products.countDocuments()} total)`);

// ─────────────────────────────────────────────────────────────────────────────
// 3. AGROCHEMICALS (15 registros)
// ─────────────────────────────────────────────────────────────────────────────
const agrochemicalsToInsert = [
  { commercialName: "Confidor 350 SC",       activeIngredient: "Imidacloprid",                        category: "INSECTICIDE",  senasaRegistrationNumber: "PQUA-01-2021", registrationExpiry: new Date("2027-06-15"), maxDose: NumberDecimal("0.5000"), waitingPeriodDays: 14, manufacturer: "Bayer CropScience",  active: true,  createdAt: new Date() },
  { commercialName: "Amistar Top",           activeIngredient: "Azoxystrobin + Difenoconazole",       category: "FUNGICIDE",    senasaRegistrationNumber: "PQUA-02-2021", registrationExpiry: new Date("2027-08-20"), maxDose: NumberDecimal("1.0000"), waitingPeriodDays: 21, manufacturer: "Syngenta",           active: true,  createdAt: new Date() },
  { commercialName: "Roundup Max",           activeIngredient: "Glifosato",                           category: "HERBICIDE",    senasaRegistrationNumber: "PQUA-03-2020", registrationExpiry: new Date("2026-12-31"), maxDose: NumberDecimal("3.0000"), waitingPeriodDays: 30, manufacturer: "Monsanto",           active: true,  createdAt: new Date() },
  { commercialName: "Karate Zeon",           activeIngredient: "Lambda-Cihalotrina",                  category: "INSECTICIDE",  senasaRegistrationNumber: "PQUA-04-2022", registrationExpiry: new Date("2028-03-10"), maxDose: NumberDecimal("0.4000"), waitingPeriodDays: 7,  manufacturer: "Syngenta",           active: true,  createdAt: new Date() },
  { commercialName: "Bayfolan Forte",        activeIngredient: "NPK + Microelementos",                category: "FERTILIZER",   senasaRegistrationNumber: "PQUA-05-2021", registrationExpiry: new Date("2027-05-01"), maxDose: NumberDecimal("5.0000"), waitingPeriodDays: 0,  manufacturer: "Bayer CropScience",  active: true,  createdAt: new Date() },
  { commercialName: "Trichoderma Harzianum", activeIngredient: "Trichoderma harzianum",               category: "BIOSTIMULANT", senasaRegistrationNumber: "PQUA-06-2023", registrationExpiry: new Date("2029-01-15"), maxDose: NumberDecimal("2.0000"), waitingPeriodDays: 0,  manufacturer: "BioAgro Peru",       active: true,  createdAt: new Date() },
  { commercialName: "Lannate 90 SP",         activeIngredient: "Metomilo",                            category: "INSECTICIDE",  senasaRegistrationNumber: "PQUA-07-2020", registrationExpiry: new Date("2026-09-30"), maxDose: NumberDecimal("0.3000"), waitingPeriodDays: 14, manufacturer: "DuPont",             active: false, createdAt: new Date(), deletedAt: new Date() },
  { commercialName: "Score 250 EC",          activeIngredient: "Difenoconazole",                      category: "FUNGICIDE",    senasaRegistrationNumber: "PQUA-08-2022", registrationExpiry: new Date("2028-07-22"), maxDose: NumberDecimal("0.5000"), waitingPeriodDays: 14, manufacturer: "Syngenta",           active: true,  createdAt: new Date() },
  { commercialName: "Engeo 247 SC",          activeIngredient: "Tiametoxam + Lambda-Cihalotrina",     category: "INSECTICIDE",  senasaRegistrationNumber: "PQUA-10-2023", registrationExpiry: new Date("2029-02-28"), maxDose: NumberDecimal("0.3000"), waitingPeriodDays: 10, manufacturer: "Syngenta",           active: true,  createdAt: new Date() },
  { commercialName: "Mancozeb 80 WP",        activeIngredient: "Mancozeb",                            category: "FUNGICIDE",    senasaRegistrationNumber: "PQUA-11-2020", registrationExpiry: new Date("2026-11-15"), maxDose: NumberDecimal("2.5000"), waitingPeriodDays: 14, manufacturer: "Dow AgroSciences",   active: true,  createdAt: new Date() },
  { commercialName: "Glufosinato Basta",     activeIngredient: "Glufosinato de amonio",               category: "HERBICIDE",    senasaRegistrationNumber: "PQUA-12-2022", registrationExpiry: new Date("2028-06-10"), maxDose: NumberDecimal("2.0000"), waitingPeriodDays: 21, manufacturer: "BASF",               active: true,  createdAt: new Date() },
  { commercialName: "Abamectina 1.8 EC",     activeIngredient: "Abamectina",                          category: "INSECTICIDE",  senasaRegistrationNumber: "PQUA-13-2021", registrationExpiry: new Date("2027-09-05"), maxDose: NumberDecimal("0.5000"), waitingPeriodDays: 7,  manufacturer: "Arysta LifeScience", active: true,  createdAt: new Date() },
  { commercialName: "Stimulate",             activeIngredient: "Citoquininas + Giberelinas + Auxinas", category: "BIOSTIMULANT", senasaRegistrationNumber: "PQUA-15-2023", registrationExpiry: new Date("2029-04-12"), maxDose: NumberDecimal("0.5000"), waitingPeriodDays: 0,  manufacturer: "Stoller",            active: true,  createdAt: new Date() },
  { commercialName: "Sulfato de Potasio",    activeIngredient: "K2SO4",                               category: "FERTILIZER",   senasaRegistrationNumber: "PQUA-16-2022", registrationExpiry: new Date("2028-10-30"), maxDose: NumberDecimal("10.000"), waitingPeriodDays: 0,  manufacturer: "SQM",                active: true,  createdAt: new Date() },
  { commercialName: "Captan 50 WP",          activeIngredient: "Captan",                              category: "FUNGICIDE",    senasaRegistrationNumber: "PQUA-18-2022", registrationExpiry: new Date("2028-12-01"), maxDose: NumberDecimal("2.0000"), waitingPeriodDays: 7,  manufacturer: "Arysta LifeScience", active: true,  createdAt: new Date() },
];

let insertedAgrochemicals = 0;
agrochemicalsToInsert.forEach(doc => {
  const exists = db.agrochemicals.findOne({ commercialName: doc.commercialName });
  if (!exists) { db.agrochemicals.insertOne(doc); insertedAgrochemicals++; }
});
print(`✅ agrochemicals: ${insertedAgrochemicals} insertados (${db.agrochemicals.countDocuments()} total)`);

print("\n🎉 Seed completado. Totales finales:");
print(`   customers:     ${db.customers.countDocuments()}`);
print(`   products:      ${db.products.countDocuments()}`);
print(`   agrochemicals: ${db.agrochemicals.countDocuments()}`);
