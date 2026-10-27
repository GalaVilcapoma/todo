// =============================================================
// record-change.js
// Registra un cambio de esquema en schema_changes
// Proyecto: AVSA Cañete — Equipo 08
//
// Se ejecuta justo después de cada script de bootstrap/ o
// changes/ para dejar constancia de qué versión se aplicó.
// El run.sh exporta las variables de entorno antes de llamarlo.
//
// Variables esperadas (inyectadas por run.sh):
//   CHANGE_SEQUENCE    — número de secuencia (ej. 1, 2, 3)
//   CHANGE_ID          — nombre del archivo sin extensión
//   CHANGE_CHECKSUM    — sha256 del script aplicado
//   GIT_SHA            — commit de Git al momento del build
//   RELEASE_VERSION    — etiqueta de la imagen (ej. 1.0)
// =============================================================

var adminDb = db.getSiblingDB('admin');
adminDb.auth(
    process.env.MONGO_INITDB_ROOT_USERNAME,
    process.env.MONGO_INITDB_ROOT_PASSWORD
);

var avsa = db.getSiblingDB('db_avsa');

var sequence       = parseInt(process.env.CHANGE_SEQUENCE, 10);
var changeId       = process.env.CHANGE_ID;
var checksum       = process.env.CHANGE_CHECKSUM;
var gitSha         = process.env.GIT_SHA;
var releaseVersion = process.env.RELEASE_VERSION;

// Solo insertamos si no existe todavía — idempotente por diseño
var already = avsa.schema_changes.countDocuments({ sequence: sequence });
if (already === 0) {
    avsa.schema_changes.insertOne({
        sequence:       NumberInt(sequence),
        changeId:       changeId,
        checksum:       checksum,
        gitSha:         gitSha,
        releaseVersion: releaseVersion,
        appliedAt:      new Date()
    });
    print('[INFO] schema_changes: registrado ' + changeId + ' (seq=' + sequence + ').');
} else {
    print('[INFO] schema_changes: secuencia ' + sequence + ' ya registrada — omitida.');
}
