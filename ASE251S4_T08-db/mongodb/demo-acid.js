// =============================================================
// DEMOSTRACIÓN PRÁCTICA DE TRANSACCIONES ACID
// Para ejecutar en el video - Alexandra
// =============================================================

print("\n" + "=".repeat(70));
print("🎬 DEMOSTRACIÓN DE TRANSACCIONES ACID EN MONGODB");
print("Proyecto AVSA Cañete - Team 08");
print("=".repeat(70) + "\n");

// Conectar a la base de datos
var db = db.getSiblingDB('db_avsa');

// =============================================================
// PREPARACIÓN: Ver estado inicial
// =============================================================
print("📊 ESTADO INICIAL:\n");

var productoInicial = db.productos.findOne({ codigo: "PROD-001" });
print("Producto: " + productoInicial.nombre);
print("Stock actual: " + productoInicial.stockActual + " unidades\n");

var pedidosIniciales = db.customer_orders.countDocuments();
print("Pedidos existentes: " + pedidosIniciales + "\n");

print("=".repeat(70) + "\n");

// =============================================================
// EJEMPLO 1: TRANSACCIÓN EXITOSA (COMMIT)
// =============================================================
print("✅ EJEMPLO 1: TRANSACCIÓN EXITOSA\n");
print("Escenario: Cliente compra 10 unidades\n");

var session1 = db.getMongo().startSession();

try {
    print("▶️  1. Iniciando transacción (startTransaction)...");
    session1.startTransaction();
    
    var sessionDb = session1.getDatabase('db_avsa');
    
    print("▶️  2. Creando pedido (tentativo)...");
    sessionDb.customer_orders.insertOne({
        numero_pedido: "PED-DEMO-001",
        customer_id: "CLI-001",
        total: 850.00,
        estado: "CONFIRMADO",
        fecha_pedido: new Date()
    });
    
    print("▶️  3. Descontando 10 unidades del stock (tentativo)...");
    sessionDb.productos.updateOne(
        { codigo: "PROD-001" },
        { $inc: { stockActual: -10 } }
    );
    
    print("▶️  4. Confirmando transacción (commitTransaction)...");
    session1.commitTransaction();
    
    print("\n✅ COMMIT EXITOSO - Cambios guardados permanentemente\n");
    
    // Verificar resultado
    var productoFinal = db.productos.findOne({ codigo: "PROD-001" });
    var pedidoCreado = db.customer_orders.findOne({ numero_pedido: "PED-DEMO-001" });
    
    print("📊 RESULTADO:");
    print("   • Pedido creado: " + (pedidoCreado ? "✅ SÍ" : "❌ NO"));
    print("   • Stock anterior: " + productoInicial.stockActual);
    print("   • Stock nuevo: " + productoFinal.stockActual);
    print("   • Diferencia: -10 unidades\n");
    print("💡 ATOMICIDAD: Ambas operaciones se aplicaron juntas\n");
    
} catch (error) {
    session1.abortTransaction();
    print("❌ ERROR: " + error.message + "\n");
} finally {
    session1.endSession();
}

print("=".repeat(70) + "\n");

// =============================================================
// EJEMPLO 2: TRANSACCIÓN FALLIDA (ABORT)
// =============================================================
print("❌ EJEMPLO 2: TRANSACCIÓN FALLIDA (ABORT)\n");
print("Escenario: Intento de comprar 1000 unidades (stock insuficiente)\n");

var session2 = db.getMongo().startSession();

try {
    print("▶️  1. Iniciando transacción...");
    session2.startTransaction();
    
    var sessionDb2 = session2.getDatabase('db_avsa');
    
    print("▶️  2. Creando pedido grande (tentativo)...");
    sessionDb2.customer_orders.insertOne({
        numero_pedido: "PED-DEMO-002",
        customer_id: "CLI-002",
        total: 95000.00,
        estado: "PENDIENTE",
        fecha_pedido: new Date()
    });
    
    print("▶️  3. Verificando stock disponible...");
    var producto = sessionDb2.productos.findOne({ codigo: "PROD-001" });
    print("   Stock disponible: " + producto.stockActual + " unidades");
    print("   Cantidad solicitada: 1000 unidades");
    
    if (producto.stockActual < 1000) {
        throw new Error("❌ STOCK INSUFICIENTE - No se puede procesar el pedido");
    }
    
} catch (error) {
    print("\n⚠️  ERROR DETECTADO: " + error.message);
    print("▶️  4. Ejecutando ABORT (abortTransaction)...");
    session2.abortTransaction();
    print("✅ ABORT EXITOSO - Todos los cambios revertidos\n");
    
    // Verificar que no hay cambios
    var pedidoNoExiste = db.customer_orders.findOne({ numero_pedido: "PED-DEMO-002" });
    var stockIntacto = db.productos.findOne({ codigo: "PROD-001" });
    
    print("📊 RESULTADO:");
    print("   • Pedido creado: " + (pedidoNoExiste ? "✅ SÍ" : "❌ NO (correcto)"));
    print("   • Stock se modificó: " + (stockIntacto.stockActual === productoFinal.stockActual ? "❌ NO (correcto)" : "✅ SÍ"));
    print("   • Stock sigue en: " + stockIntacto.stockActual + " unidades\n");
    print("💡 CONSISTENCIA: MongoDB protegió contra stock negativo\n");
    
} finally {
    session2.endSession();
}

print("=".repeat(70) + "\n");

// =============================================================
// EJEMPLO 3: LOCKS (ISOLATION)
// =============================================================
print("🔒 EJEMPLO 3: LOCKS Y AISLAMIENTO (ISOLATION)\n");

print("💡 CONCEPTO:");
print("   • Cuando una transacción modifica un documento, lo BLOQUEA");
print("   • Otras transacciones NO pueden modificarlo hasta COMMIT/ABORT");
print("   • Esto evita conflictos y garantiza ISOLATION\n");

print("📝 ESCENARIO:");
print("   Cliente A: Inicia transacción, modifica PROD-001, NO hace commit");
print("   Cliente B: Intenta modificar PROD-001 → BLOQUEADO (debe esperar)");
print("   Cliente A: Hace commit → LIBERA el lock");
print("   Cliente B: Ahora puede proceder\n");

print("✅ Esto evita el 'overselling' (vender más de lo disponible)\n");

print("=".repeat(70) + "\n");

// =============================================================
// RESUMEN FINAL
// =============================================================
print("📚 RESUMEN DE TRANSACCIONES ACID:\n");
print("✅ A - ATOMICITY (Atomicidad):");
print("   → Todo o nada. Ejemplo 1 mostró commit exitoso\n");

print("✅ C - CONSISTENCY (Consistencia):");
print("   → Siempre estados válidos. Ejemplo 2 protegió contra stock negativo\n");

print("✅ I - ISOLATION (Aislamiento):");
print("   → Sin interferencias. Locks previenen conflictos concurrentes\n");

print("✅ D - DURABILITY (Durabilidad):");
print("   → Cambios permanentes después de commit\n");

print("=".repeat(70));
print("✅ DEMOSTRACIÓN COMPLETA");
print("=".repeat(70) + "\n");
