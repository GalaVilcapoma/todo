// =============================================================================
// MONGODB INDEXES - AVSA PROJECT
// Author    : Team T08
// Database  : db_avsa (single database with 3 collections)
//
// HOW TO RUN:
//   1. With the cluster URI:
//      mongosh "mongodb+srv://<user>:<password>@<cluster>.mongodb.net/db_avsa" \
//               --file indices-mongodb.js
//   2. Or in MongoDB Compass: collection → Indexes → Create Index (copy each definition).
//
// NOTE: Spring Data MongoDB also creates these indexes automatically on
//       application startup via the @Indexed/@CompoundIndex annotations in
//       the models (products, customers, agrochemicals), with
//       auto-index-creation enabled by default.
// =============================================================================

// -----------------------------------------------------------------------------
// 1. idx_customers_state  →  customers.state
//    Optimizes: CustomerRepository.findByState(...) → { state: "A" | "I" }
//    (customer list by state and active-customer validation in orders)
// -----------------------------------------------------------------------------
db.customers.createIndex(
  { state: 1 },
  { name: "idx_customers_state" }
);

// -----------------------------------------------------------------------------
// 2. idx_products_active  →  products.active
//    Optimizes: ProductoRepository.findByActive(...) → { active: true | false }
//    (active/inactive product catalog - frequent query of the module)
// -----------------------------------------------------------------------------
db.products.createIndex(
  { active: 1 },
  { name: "idx_products_active" }
);

// -----------------------------------------------------------------------------
// 3. idx_products_category  →  products.category
//    Optimizes: Pipeline 1 "summary by category"
//    ($group by category over db.products) - inventory dashboard
// -----------------------------------------------------------------------------
db.products.createIndex(
  { category: 1 },
  { name: "idx_products_category" }
);

// -----------------------------------------------------------------------------
// 4. idx_agrochemicals_category_active  →  agrochemicals { category, active }
//    Optimizes: AgrochemicalRepository.findByCategoryAndActiveTrue(category)
//    → { category: <ENUM>, active: true } (menu filter by category)
// -----------------------------------------------------------------------------
db.agrochemicals.createIndex(
  { category: 1, active: 1 },
  { name: "idx_agrochemicals_category_active" }
);

// -----------------------------------------------------------------------------
// 5. idx_agrochemicals_active_expiry  →  agrochemicals { active, registrationExpiry }
//    Optimizes: AgrochemicalRepository.findByActiveTrueAndRegistrationExpiryBefore(date)
//    → { active: true, registrationExpiry: { $lt: <fecha> } } (SENASA expiry alerts)
// -----------------------------------------------------------------------------
db.agrochemicals.createIndex(
  { active: 1, registrationExpiry: 1 },
  { name: "idx_agrochemicals_active_expiry" }
);

// -----------------------------------------------------------------------------
// 6. idx_agrochemicals_active_manufacturer  →  agrochemicals { active, manufacturer }
//    Optimizes: Pipeline 2 "ranking of active manufacturers"
//    ($match active:true + $group by manufacturer over db.agrochemicals)
// -----------------------------------------------------------------------------
db.agrochemicals.createIndex(
  { active: 1, manufacturer: 1 },
  { name: "idx_agrochemicals_active_manufacturer" }
);

// -----------------------------------------------------------------------------
// VERIFICATION / EVIDENCE
// -----------------------------------------------------------------------------
print("=== Indexes of db.customers ===");
db.customers.getIndexes();
print("=== Indexes of db.products ===");
db.products.getIndexes();
print("=== Indexes of db.agrochemicals ===");
db.agrochemicals.getIndexes();