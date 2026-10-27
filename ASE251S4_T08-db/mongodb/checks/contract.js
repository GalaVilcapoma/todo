// =============================================================
// contract.js
// Verificación del contrato del esquema db_avsa
// Proyecto: AVSA Cañete — Equipo 08
//
// Se ejecuta al final de cada reconciliación. Si algo no está
// como se espera, el script lanza un Error y el contenedor
// falla con código de salida distinto de 0 — así el equipo
// detecta problemas antes de que el backend se conecte.
// =============================================================

var adminDb = db.getSiblingDB('admin');
adminDb.auth(
    process.env.MONGO_INITDB_ROOT_USERNAME,
    process.env.MONGO_INITDB_ROOT_PASSWORD
);

var avsa = db.getSiblingDB('db_avsa');
var errors = 0;

// ── Verificamos que la tabla de control exista ─────────────────
var controlExists = avsa.getCollectionInfos({ name: 'schema_changes' }).length;
if (controlExists !== 1) {
    print('[ERROR] Colección schema_changes no encontrada.');
    errors++;
}

// ── Verificamos que las colecciones del dominio existan ────────
var required = ['customer', 'productos', 'agrochemicals', 'notificaciones', 'audit_logs', 'dashboard_metrics'];
required.forEach(function(col) {
    var found = avsa.getCollectionInfos({ name: col }).length;
    if (found !== 1) {
        print('[ERROR] Falta la colección: ' + col);
        errors++;
    }
});

// ── Verificamos que los índices únicos críticos estén activos ──
var customerIndexes = avsa.customer.getIndexes();
var hasCodigoIndex = customerIndexes.some(function(i) {
    return i.name === 'idx_customer_codigo' && i.unique === true;
});
if (!hasCodigoIndex) {
    print('[ERROR] Falta el índice único idx_customer_codigo en customer.');
    errors++;
}

var productosIndexes = avsa.productos.getIndexes();
var hasProductoCodigoIndex = productosIndexes.some(function(i) {
    return i.name === 'idx_productos_codigo' && i.unique === true;
});
if (!hasProductoCodigoIndex) {
    print('[ERROR] Falta el índice único idx_productos_codigo en productos.');
    errors++;
}

// ── Verificamos que el seed mínimo esté presente ───────────────
var clienteSemilla = avsa.customer.countDocuments({ codigo: 'CLI-001' });
if (clienteSemilla !== 1) {
    print('[ERROR] Falta el cliente semilla CLI-001.');
    errors++;
}

var productoSemilla = avsa.productos.countDocuments({ codigo: 'PROD-001' });
if (productoSemilla !== 1) {
    print('[ERROR] Falta el producto semilla PROD-001.');
    errors++;
}

var agroSemilla = avsa.agrochemicals.countDocuments({ senasaRegistrationNumber: 'SEN-2024-001' });
if (agroSemilla !== 1) {
    print('[ERROR] Falta el agroquímico semilla SEN-2024-001.');
    errors++;
}

// ── Resultado final ────────────────────────────────────────────
if (errors === 0) {
    print('[SUCCESS] Contrato MongoDB verificado — db_avsa está en orden.');
} else {
    throw new Error('[FAILURE] El contrato falló con ' + errors + ' error(es). Revisa los logs anteriores.');
}
