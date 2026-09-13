import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Configurar rutas relativas seguras para ESModules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');
const backupsDir = path.join(projectRoot, 'backups');
const dbPath = path.join(backupsDir, 'arbol_dev.db');

// Asegurar existencia del directorio de copias de seguridad/DB
if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
}

console.log(`=========================================================`);
console.log(`    INICIALIZANDO BASE DE DATOS FÍSICA - ÁRBOL BY KLIK   `);
console.log(`=========================================================`);
console.log(`Ubicación de base de datos: ${dbPath}`);

const db = new Database(dbPath, { verbose: console.log });

// Habilitar soporte de llaves foráneas para mantener integridad referencial
db.pragma('foreign_keys = ON');

try {
    // Crear tablas lógicas del Dominio Genealógico
    db.exec(`
        CREATE TABLE IF NOT EXISTS people (
            id TEXT PRIMARY KEY,
            canonical_name TEXT NOT NULL,
            gender TEXT CHECK(gender IN ('MALE', 'FEMALE', 'UNKNOWN')) NOT NULL,
            state TEXT CHECK(state IN ('LIVING', 'DECEASED', 'UNKNOWN')) NOT NULL,
            research_status TEXT CHECK(research_status IN ('DOCUMENTED', 'FAMILY-SOURCED', 'HYPOTHESIS', 'UNKNOWN')) NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS relationships (
            id TEXT PRIMARY KEY,
            person_a_id TEXT NOT NULL,
            person_b_id TEXT NOT NULL,
            type TEXT CHECK(type IN ('PARENT_CHILD', 'SPOUSAL', 'SIBLING_LATERAL', 'OTHER')) NOT NULL,
            verification_level TEXT CHECK(verification_level IN ('DOCUMENTED', 'FAMILY-SOURCED', 'HYPOTHESIS', 'REJECTED', 'UNKNOWN')) NOT NULL,
            provenance_id TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY(person_a_id) REFERENCES people(id) ON DELETE CASCADE,
            FOREIGN KEY(person_b_id) REFERENCES people(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS events (
            id TEXT PRIMARY KEY,
            person_id TEXT,
            relationship_id TEXT,
            type TEXT CHECK(type IN ('BIRTH', 'BAPTISM', 'MARRIAGE', 'DEATH', 'BURIAL', 'RESIDENCE', 'MIGRATION')) NOT NULL,
            event_year INTEGER NOT NULL,
            event_month INTEGER,
            event_day INTEGER,
            is_approximate INTEGER NOT NULL CHECK(is_approximate IN (0, 1)),
            confidence_range_years INTEGER,
            place_id TEXT,
            provenance_id TEXT,
            FOREIGN KEY(person_id) REFERENCES people(id) ON DELETE CASCADE,
            FOREIGN KEY(relationship_id) REFERENCES relationships(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS evidence (
            id TEXT PRIMARY KEY,
            source_id TEXT NOT NULL,
            type TEXT CHECK(type IN ('CIVIL_RECORD', 'PARISH_BOOK', 'PHOTO', 'TESTIMONY', 'OTHER')) NOT NULL,
            confidence_rating TEXT CHECK(confidence_rating IN ('HIGH', 'MEDIUM', 'LOW')) NOT NULL,
            file_hash TEXT,
            file_path TEXT,
            transcription TEXT,
            provenance_id TEXT,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS citations (
            id TEXT PRIMARY KEY,
            evidence_id TEXT NOT NULL,
            volume TEXT,
            book TEXT,
            page_number TEXT,
            entry_number TEXT,
            custom_reference TEXT,
            FOREIGN KEY(evidence_id) REFERENCES evidence(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS audit_log (
            id TEXT PRIMARY KEY,
            timestamp TEXT NOT NULL,
            user_identity TEXT NOT NULL,
            action_type TEXT CHECK(action_type IN ('CREATE', 'UPDATE', 'CONFIRM', 'REJECT', 'MERGE', 'SPLIT', 'LINK', 'UNLINK')) NOT NULL,
            entity_name TEXT NOT NULL,
            entity_id TEXT NOT NULL,
            payload_before TEXT,
            payload_after TEXT NOT NULL,
            justification TEXT NOT NULL,
            parent_hash TEXT,
            record_hash TEXT NOT NULL
        );
    `);
    
    console.log("✔ Estructura física inicializada con éxito.");
} catch (error) {
    console.error("✖ Error al inicializar la base de datos:", error);
    process.exit(1);
} finally {
    db.close();
    console.log("Conexión con SQLite cerrada limpiamente.");
}