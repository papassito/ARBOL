import Database from 'better-sqlite3';
import { SQL_SCHEMA } from './schema.js';
import * as path from 'path';
import * as fs from 'fs';
import { startTerminalUI } from '../ui/terminal_ui.js';
import { startWebServer } from '../api/server.js';
export function initializeDatabase(dbPath) {
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
    }
    const db = new Database(dbPath);
    // Habilitar llaves foráneas explícitamente en la conexión
    db.pragma('foreign_keys = ON');
    // Ejecutar esquema atómicamente dentro de una transacción
    db.transaction(() => {
        db.exec(SQL_SCHEMA);
    })();
    return db;
}
const defaultPath = path.join(process.cwd(), 'backups', 'arbol_dev.db');
console.log(`[INIT] Inicializando base de datos local en: ${defaultPath}`);
const db = initializeDatabase(defaultPath);
console.log('---');
console.log('🟢 [OK] ¡Base de datos SQLite local de ÁRBOL by KLIK inicializada exitosamente!');
// Lanzar el servidor web local-first de forma asíncrona (Puerto 3000)
startWebServer(db, 3000);
// Lanzar la interfaz de usuario interactiva
await startTerminalUI(db);
