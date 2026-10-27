// =============================================================
// transactions_acid.js — Transacciones ACID en MongoDB
// Proyecto: AVSA Cañete — Equipo 08
//
// MongoDB soporta transacciones multi-documento ACID desde la
// versión 4.0, pero SOLO dentro de un replica set (o sharded
// cluster). Este script demuestra dos escenarios clásicos del
// dominio AVSA:
//
//   1. COMMIT   → registrar un pedido, descontar stock de los
//                 productos y escribir el log de auditoría. Todo
//                 se confirma junto o nada.
//   2. ROLLBACK → intentar un pedido cuya cantidad supera el
//                 stock disponible. La transacción se aborta y
//                 el estado de la base de datos queda intacto.
//
// Ejecutar con:
//   docker compose exec -T mongodb mongosh --quiet \
//     "mongodb://127.0.0.1:27017/db_avsa?directConnection=true" \
//     < mongodb/examples/transactions_acid.js
// o usando el runner:  mongodb/examples/run-transactions.sh
// =============================================================

// En el entorno local de docker compose, MongoDB corre SIN
// autenticación. Si tu despliegue tiene auth habilitada, define
// MONGO_AUTH_ENABLED=true y las credenciales root.
if (process.env.MONGO_AUTH_ENABLED === 'true' && process.env.MONGO_INITDB_ROOT_USERNAME) {
    db.getSiblingDB('admin').auth(
        process.env.MONGO_INITDB_ROOT_USERNAME,
        process.env.MONGO_INITDB_ROOT_PASSWORD);
}

const avsa = db.getSiblingDB('db_avsa');

print('=============================================================');
print(' DVSA Cañete — Demostración de transacciones ACID en MongoDB');
print('=============================================================');

// ── Verificación previa: ¿es un replica set? ─────────────────
const hello = avsa.adminCommand({ hello: 1 });
if (!hello.setName) {
    print('[ERROR] MongoDB no corre como replica set. Las transacciones requieren rs0.');
    quit(1);
}
print('[OK] Replica set detectado: ' + hello.setName);

const stamp = Date.now();

// ══════════════════════════════════════════════════════════════
// ESCENARIO 1 — COMMIT: venta consistente
// ══════════════════════════════════════════════════════════════
print('');
print('--- ESCENARIO 1: COMMIT (venta con stock y auditoría) ---');

const prodA = avsa.productos_v2.findOne({ codigo: 'PV2-001' });
const prodB = avsa.productos_v2.findOne({ codigo: 'PV2-002' });

if (!prodA || !prodB) {
    print('[SKIP] Faltan productos PV2-001/PV2-002. ¿Se aplicó V003?');
} else {
    const stockA_antes = prodA.stockActual;
    const stockB_antes = prodB.stockActual;
    const qtyA = 10, qtyB = 5;

    print('Stock antes  → PV2-001: ' + stockA_antes + ' | PV2-002: ' + stockB_antes);

    const session1 = db.getMongo().startSession();
    session1.startTransaction();
    try {
        const s = session1.getDatabase('db_avsa');
        const numero = 'TXN-' + stamp + '-OK';

        s.pedidos_detalle.insertOne({
            numeroPedido: numero,
            clienteCodigo: 'CLI-001',
            fechaPedido: new Date(),
            estado: 'CONFIRMADO',
            items: [
                { productoCodigo: 'PV2-001', nombre: prodA.nombre, cantidad: qtyA, precioUnitario: prodA.precioUnitario },
                { productoCodigo: 'PV2-002', nombre: prodB.nombre, cantidad: qtyB, precioUnitario: prodB.precioUnitario }
            ],
            moneda: 'PEN',
            observaciones: 'Venta consistente (transacción ACID)',
            createdAt: new Date()
        });

        const rA = s.productos_v2.updateOne(
            { codigo: 'PV2-001' }, { $inc: { stockActual: -qtyA } });
        const rB = s.productos_v2.updateOne(
            { codigo: 'PV2-002' }, { $inc: { stockActual: -qtyB } });

        s.audit_logs_v2.insertOne({
            accion: 'CREATE', modulo: 'PEDIDO', entidadId: numero,
            userName: 't08-demo', timestamp: new Date(),
            detalle: 'Pedido confirmado dentro de una transacción; stock descontado atómicamente',
            ip: '127.0.0.1'
        });

        // Lectura DENTRO de la transacción: el pedido ya es visible
        const visible = s.pedidos_detalle.countDocuments({ numeroPedido: numero });
        print('Documentos visibles dentro de la transacción: ' + visible);

        session1.commitTransaction();
        print('[OK] COMMIT ejecutado.');
        print('  - pedidos_detalle insertados: 1 (' + numero + ')');
        print('  - productos_v2 modificados:   ' + (rA.modifiedCount + rB.modifiedCount));
        print('  - audit_logs_v2 insertados:   1');
    } catch (e) {
        session1.abortTransaction();
        print('[ERROR] Transacción abortada: ' + e.message);
    } finally {
        session1.endSession();
    }

    const A = avsa.productos_v2.findOne({ codigo: 'PV2-001' }).stockActual;
    const B = avsa.productos_v2.findOne({ codigo: 'PV2-002' }).stockActual;
    print('Stock después → PV2-001: ' + A + ' | PV2-002: ' + B);
}

// ══════════════════════════════════════════════════════════════
// ESCENARIO 2 — ROLLBACK: stock insuficiente
// ══════════════════════════════════════════════════════════════
print('');
print('--- ESCENARIO 2: ROLLBACK (stock insuficiente) ---');

if (prodA) {
    const antesPedido = avsa.pedidos_detalle.countDocuments({ numeroPedido: 'TXN-' + stamp + '-FAIL' });
    const antesStock = avsa.productos_v2.findOne({ codigo: 'PV2-001' }).stockActual;

    const session2 = db.getMongo().startSession();
    session2.startTransaction();
    let fallo = false;
    try {
        const s = session2.getDatabase('db_avsa');
        const numero = 'TXN-' + stamp + '-FAIL';

        s.pedidos_detalle.insertOne({
            numeroPedido: numero,
            clienteCodigo: 'CLI-001',
            fechaPedido: new Date(),
            estado: 'CONFIRMADO',
            items: [{ productoCodigo: 'PV2-001', nombre: 'Cantidad imposible', cantidad: 999999 }],
            moneda: 'PEN',
            observaciones: 'Debe fallar por stock insuficiente',
            createdAt: new Date()
        });

        // Descuento condicional: solo si hay stock suficiente
        const r = s.productos_v2.updateOne(
            { codigo: 'PV2-001', stockActual: { $gte: 999999 } },
            { $inc: { stockActual: -999999 } });

        if (r.modifiedCount !== 1) {
            throw new Error('Stock insuficiente para PV2-001');
        }

        s.audit_logs_v2.insertOne({
            accion: 'CREATE', modulo: 'PEDIDO', entidadId: numero,
            userName: 't08-demo', timestamp: new Date(),
            detalle: 'No debería llegar aquí', ip: '127.0.0.1'
        });

        session2.commitTransaction();
    } catch (e) {
        fallo = true;
        session2.abortTransaction();
        print('[OK] ROLLBACK ejecutado por: ' + e.message);
    } finally {
        session2.endSession();
    }

    const despuesPedido = avsa.pedidos_detalle.countDocuments({ numeroPedido: 'TXN-' + stamp + '-FAIL' });
    const despuesStock = avsa.productos_v2.findOne({ codigo: 'PV2-001' }).stockActual;

    print('  - ¿Se insertó el pedido fallido? ' + (despuesPedido - antesPedido === 0 ? 'NO (correcto)' : 'SÍ (incorrecto)'));
    print('  - Stock PV2-001 sin cambios: ' + (despuesStock === antesStock ? 'SÍ (correcto)' : 'NO (incorrecto)'));
}

print('');
print('=============================================================');
print(' Demostración completada: las transacciones son todo-o-nada.');
print('=============================================================');
