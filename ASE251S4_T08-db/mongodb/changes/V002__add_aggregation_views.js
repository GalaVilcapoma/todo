// =============================================================
// V002__add_aggregation_views.js
// Pipelines de agregación como vistas persistentes (views)
// Proyecto: AVSA Cañete — Equipo 08
//
// Este cambio crea dos vistas MongoDB que encapsulan los
// pipelines de análisis más usados por el equipo. Las vistas
// se pueden consultar como colecciones normales sin repetir
// el pipeline en cada query del backend.
// =============================================================

var adminDb = db.getSiblingDB('admin');
adminDb.auth(
    process.env.MONGO_INITDB_ROOT_USERNAME,
    process.env.MONGO_INITDB_ROOT_PASSWORD
);

var avsa = db.getSiblingDB('db_avsa');

// Vista: resumen de productos agrupados por categoría
// Útil para el dashboard de inventario del panel de logística
avsa.createView('vw_productos_por_categoria', 'productos', [
    {
        $group: {
            _id:            '$categoria',
            totalProductos: { $sum: 1 },
            precioPromedio: { $avg: { $toDouble: '$precioUnitario' } },
            stockTotal:     { $sum: '$stockActual' }
        }
    },
    {
        $project: {
            _id: 0,
            categoria:      '$_id',
            totalProductos:  1,
            precioPromedio: { $round: ['$precioPromedio', 2] },
            stockTotal:      1
        }
    },
    { $sort: { stockTotal: -1 } }
]);
print('[INFO] Vista vw_productos_por_categoria creada.');

// Vista: ranking de fabricantes de agroquímicos activos
// Utilizada por el módulo SENASA para supervisar proveedores
avsa.createView('vw_ranking_fabricantes', 'agrochemicals', [
    { $match: { active: true } },
    {
        $group: {
            _id:                '$manufacturer',
            totalProductos:     { $sum: 1 },
            categorias:         { $addToSet: '$category' },
            diasEsperaPromedio: { $avg: '$waitingPeriodDays' }
        }
    },
    {
        $project: {
            _id: 0,
            fabricante:         '$_id',
            totalProductos:      1,
            categorias:          1,
            diasEsperaPromedio: { $round: ['$diasEsperaPromedio', 1] }
        }
    },
    { $sort: { totalProductos: -1 } }
]);
print('[INFO] Vista vw_ranking_fabricantes creada.');

print('[SUCCESS] V002 — vistas de agregación aplicadas.');
