// =============================================================================
// PIPELINES DE AGREGACIÓN MONGODB - PROYECTO AVSA
// Autor   : Pierre Conca
// Base de datos : avsa_db
// Conexión: mongosh "mongodb://avsa_user:AvSaPass123@localhost:27017/avsa_db?authSource=avsa_db"
// =============================================================================


// =============================================================================
// PIPELINE 1 — Resumen de productos por categoría
// Colección   : products
// Funcionalidad: Muestra cuántos productos hay por categoría, su precio
//               promedio y el stock total acumulado. Útil para el dashboard
//               de inventario y análisis de oferta por tipo de producto.
// Etapas usadas: $group → $project → $sort
// =============================================================================
db.products.aggregate([
  {
    // Agrupa todos los documentos por el campo "category"
    $group: {
      _id: "$category",
      totalProducts: { $sum: 1 },
      // $toDouble convierte Decimal128 a número para poder calcular el promedio
      averagePrice:  { $avg: { $toDouble: "$unitPrice" } },
      totalStock:    { $sum: "$currentStock" }
    }
  },
  {
    // Renombramos _id a un campo más legible y redondeamos el precio
    $project: {
      _id: 0,
      category:      "$_id",
      totalProducts: 1,
      averagePrice: { $round: ["$averagePrice", 2] },
      totalStock:    1
    }
  },
  {
    // Ordena de mayor a menor stock total
    $sort: { totalStock: -1 }
  }
]);

// Resultado esperado:
// { category: 'Fertilizantes', totalProducts: 1, averagePrice: 45.5, totalStock: 100 }


// =============================================================================
// PIPELINE 2 — Ranking de fabricantes de agroquímicos activos
// Colección   : agrochemicals
// Funcionalidad: Agrupa los agroquímicos activos por fabricante, mostrando
//               cuántos productos tiene cada uno, qué categorías maneja y
//               el promedio de días de espera (período de carencia). Útil
//               para evaluar proveedores y tiempos de carencia SENASA.
// Etapas usadas: $match → $group → $project → $sort
// =============================================================================
db.agrochemicals.aggregate([
  {
    // Filtra solo agroquímicos con active = true
    $match: { active: true }
  },
  {
    // Agrupa por fabricante
    $group: {
      _id:               "$manufacturer",
      totalProducts:     { $sum: 1 },
      // $addToSet crea un array sin duplicados con todas las categorías del fabricante
      categories:        { $addToSet: "$category" },
      averageWaitingDays:{ $avg: "$waitingPeriodDays" }
    }
  },
  {
    // Reestructura la salida para que sea más legible
    $project: {
      _id: 0,
      manufacturer:      "$_id",
      totalProducts:     1,
      categories:        1,
      averageWaitingDays:{ $round: ["$averageWaitingDays", 1] }
    }
  },
  {
    // Ordena por cantidad de productos descendente (ranking)
    $sort: { totalProducts: -1 }
  }
]);

// Resultado esperado:
// { manufacturer: 'Syngenta',          totalProducts: 2, categories: ['INSECTICIDE','FUNGICIDE'], averageWaitingDays: 17.5 }
// { manufacturer: 'Bayer CropScience', totalProducts: 1, categories: ['HERBICIDE'],               averageWaitingDays: 15   }
