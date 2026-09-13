// c:\Users\CMSoluciones\Documents\ARBOL\src\ui\terminal_ui.ts
// Interfaz de Consola Core Interactiva para ÁRBOL by KLIK
import Database from 'better-sqlite3';
import crypto from 'node:crypto';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

// Paleta de Colores ANSI para Consola
const C = {
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    gray: '\x1b[90m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

// Función auxiliar para calcular firmas digitales de auditoría exactamente igual a forensic_audit.ps1
function calculateRecordHash(log: {
    id: string;
    timestamp: string;
    user_identity: string;
    action_type: string;
    entity_name: string;
    entity_id: string;
    payload_before: string | null;
    payload_after: string;
    justification: string;
    parent_hash: string | null;
}): string {
    const payload = log.id + log.timestamp + log.user_identity + log.action_type + 
                    log.entity_name + log.entity_id + (log.payload_before || '') + 
                    log.payload_after + log.justification + (log.parent_hash || '');
    return crypto.createHash('sha256').update(payload).digest('hex');
}

// Escribir entrada segura y encadenada en el Audit Log
function logAuditAction(
    db: Database.Database, 
    action: 'CREATE' | 'UPDATE' | 'LINK' | 'UNLINK', 
    entityName: string, 
    entityId: string, 
    payloadBefore: string | null, 
    payloadAfter: string, 
    justification: string
): void {
    const id = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    const userIdentity = 'human_validator';

    // Obtener el último hash de auditoría para entrelazar la cadena inmutable
    const lastLog = db.prepare('SELECT record_hash FROM audit_log ORDER BY timestamp DESC LIMIT 1').get() as { record_hash: string } | undefined;
    const parentHash = lastLog ? lastLog.record_hash : null;

    const logRecord = {
        id,
        timestamp,
        user_identity: userIdentity,
        action_type: action,
        entity_name: entityName,
        entity_id: entityId,
        payload_before: payloadBefore,
        payload_after: payloadAfter,
        justification,
        parent_hash: parentHash
    };

    const recordHash = calculateRecordHash(logRecord);

    db.prepare(`
        INSERT INTO audit_log (id, timestamp, user_identity, action_type, entity_name, entity_id, payload_before, payload_after, justification, parent_hash, record_hash)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, timestamp, userIdentity, action, entityName, entityId, payloadBefore, payloadAfter, justification, parentHash, recordHash);
}

export async function startTerminalUI(db: Database.Database): Promise<void> {
    const rl = readline.createInterface({ input, output });

    try {
        let running = true;
        while (running) {
            console.log(`\n${C.cyan}=========================================================`);
            console.log(` 🌳   ÁRBOL by KLIK :: CONSOLA INTERACTIVA CORE   🌳     `);
            console.log(`      [Soberanía, Evidencia Criptográfica, Inmutabilidad]`);
            console.log(`=========================================================${C.reset}`);
            console.log(`1. 👥 Listar Registro de Personas (Person Registry)`);
            console.log(`2. ➕ Registrar Nueva Persona (Zero Synthetic)`);
            console.log(`3. 🔗 Establecer Relación Familiar (Relationship Engine)`);
            console.log(`4. 📂 Ver Registro de Evidencias (Evidence Catalog)`);
            console.log(`5. 🛡️  Ejecutar Diagnóstico de Seguridad Forense`);
            console.log(`0. ❌ Cerrar y Salir`);
            console.log(`${C.cyan}---------------------------------------------------------${C.reset}`);
            
            const choice = await rl.question('Seleccione una opción: ');
            console.log('');

            switch (choice.trim()) {
                case '1': {
                    const people = db.prepare('SELECT * FROM people ORDER BY canonical_name ASC').all() as any[];
                    console.log(`${C.bold}👥 REGISTRO HISTÓRICO DE IDENTIDADES (${people.length}):${C.reset}`);
                    if (people.length === 0) {
                        console.log(`${C.gray}   (No hay personas registradas en la base de datos).${C.reset}`);
                    } else {
                        people.forEach(p => {
                            const color = p.research_status === 'DOCUMENTED' ? C.green : C.yellow;
                            console.log(` -> ID: ${C.gray}${p.id}${C.reset} | ${C.bold}${p.canonical_name}${C.reset} (${p.gender}) [${color}${p.research_status}${C.reset}]`);
                        });
                    }
                    break;
                }
                case '2': {
                    console.log(`${C.bold}➕ REGISTRAR NUEVA IDENTIDAD GENÉRICA:${C.reset}`);
                    const name = await rl.question(' -> Nombre Canónico (ej. GivenName-Alpha Surname-Beta): ');
                    if (!name.trim()) {
                        console.log(`${C.red}✖ Error: El nombre no puede estar vacío.${C.reset}`);
                        break;
                    }
                    const genderInput = await rl.question(' -> Género (MALE/FEMALE/UNKNOWN): ');
                    const gender = genderInput.toUpperCase().trim();
                    if (!['MALE', 'FEMALE', 'UNKNOWN'].includes(gender)) {
                        console.log(`${C.red}✖ Error: Género inválido.${C.reset}`);
                        break;
                    }
                    const statusInput = await rl.question(' -> Estatus de Investigación (DOCUMENTED/FAMILY-SOURCED/HYPOTHESIS): ');
                    const status = statusInput.toUpperCase().trim();
                    if (!['DOCUMENTED', 'FAMILY-SOURCED', 'HYPOTHESIS'].includes(status)) {
                        console.log(`${C.red}✖ Error: Estatus de investigación inválido.${C.reset}`);
                        break;
                    }
                    const justification = await rl.question(' -> Justificación pericial de la ingesta (Obligatoria): ');
                    if (!justification.trim()) {
                        console.log(`${C.red}✖ Error: La justificación es obligatoria para el Audit Log.${C.reset}`);
                        break;
                    }

                    const id = crypto.randomUUID();
                    const now = new Date().toISOString();

                    try {
                        // Ejecutar inserción y auditoría de forma atómica bajo una transacción SQLite (ACID Compliance)
                        const registerTx = db.transaction(() => {
                            db.prepare(`
                                INSERT INTO people (id, canonical_name, gender, state, research_status, created_at, updated_at)
                                VALUES (?, ?, ?, 'UNKNOWN', ?, ?, ?)
                            `).run(id, name, gender, status, now, now);

                            logAuditAction(db, 'CREATE', 'people', id, null, JSON.stringify({ canonical_name: name, gender, research_status: status }), justification);
                        });

                        registerTx();
                        console.log(`\n${C.green}✔ Persona registrada de forma segura e inscrita de forma atómica en el Audit Log con ID: ${id}${C.reset}`);
                    } catch (err: any) {
                        console.log(`${C.red}✖ Error al registrar la persona (Fallo de transacción o restricciones): ${err.message}${C.reset}`);
                    }
                    break;
                }
                case '3': {
                    console.log(`${C.bold}🔗 ESTABLECER NUEVA RELACIÓN DE PARENTESCO:${C.reset}`);
                    const idA = await rl.question(' -> UUID Persona A: ');
                    const idB = await rl.question(' -> UUID Persona B: ');
                    const relTypeInput = await rl.question(' -> Tipo de relación (PARENT_CHILD/SPOUSAL/SIBLING_LATERAL): ');
                    const relType = relTypeInput.toUpperCase().trim();
                    const certInput = await rl.question(' -> Nivel de Certeza (DOCUMENTED/FAMILY-SOURCED/HYPOTHESIS): ');
                    const cert = certInput.toUpperCase().trim();
                    const justification = await rl.question(' -> Justificación de parentesco (Obligatoria): ');

                    if (!justification.trim()) {
                        console.log(`${C.red}✖ Error: Justificación obligatoria.${C.reset}`);
                        break;
                    }

                    try {
                        const id = crypto.randomUUID();
                        const now = new Date().toISOString();

                        // Ejecutar relación y auditoría de forma atómica bajo una transacción SQLite
                        const linkTx = db.transaction(() => {
                            db.prepare(`
                                INSERT INTO relationships (id, person_a_id, person_b_id, type, verification_level, created_at)
                                VALUES (?, ?, ?, ?, ?, ?)
                            `).run(id, idA, idB, relType, cert, now);

                            logAuditAction(db, 'LINK', 'relationships', id, null, JSON.stringify({ person_a_id: idA, person_b_id: idB, type: relType }), justification);
                        });

                        linkTx();
                        console.log(`\n${C.green}✔ Relación familiar establecida con éxito e inscrita de forma atómica en la cadena criptográfica.${C.reset}`);
                    } catch (err: any) {
                        console.log(`${C.red}✖ Error al establecer parentesco (Fallo de transacción o restricción referencial): ${err.message}${C.reset}`);
                    }
                    break;
                }
                case '4': {
                    const evidence = db.prepare('SELECT * FROM evidence').all() as any[];
                    console.log(`${C.bold}📂 ARCHIVO DE EVIDENCIAS REGISTRADAS (${evidence.length}):${C.reset}`);
                    if (evidence.length === 0) {
                        console.log(`${C.gray}   (No hay evidencias ni documentos asociados en el disco).${C.reset}`);
                    } else {
                        evidence.forEach(e => {
                            console.log(` -> ID: ${C.gray}${e.id}${C.reset} | Tipo: ${e.type} | Confianza: [${C.green}${e.confidence_rating}${C.reset}] | Hash: ${e.file_hash || 'Sin firma'}`);
                        });
                    }
                    break;
                }
                case '5': {
                    console.log(`${C.bold}🛡️  INICIANDO DIAGNÓSTICO DE SEGURIDAD LÓGICA Y CRIPTOGRÁFICA:${C.reset}`);
                    
                    try {
                        // 1. Diagnóstico de corrupción interna
                        const integrity = db.prepare('PRAGMA integrity_check').get() as any;
                        if (integrity && integrity.integrity_check === 'ok') {
                            console.log(` -> [OK] PRAGMA integrity_check: ${C.green}SANO (Sin páginas corruptas)${C.reset}`);
                        } else {
                            console.log(` -> [FALLO] PRAGMA integrity_check: ${C.red}CORRUPTO o ANÓMALO${C.reset}`);
                        }

                        // 2. Verificación de cadena criptográfica (blockchain de auditoría)
                        const logs = db.prepare('SELECT * FROM audit_log ORDER BY timestamp ASC').all() as any[];
                        let chainBroken = false;
                        let computedParentHash: string | null = null;

                        for (let i = 0; i < logs.length; i++) {
                            const log = logs[i];
                            const hash = calculateRecordHash(log);

                            if (hash !== log.record_hash || (i > 0 && log.parent_hash !== computedParentHash)) {
                                chainBroken = true;
                                console.log(` -> ${C.red}✖ ALERTA FORENSE: Alteración o ruptura detectada en bloque ID: ${log.id}${C.reset}`);
                                break;
                            }
                            computedParentHash = log.record_hash;
                        }

                        if (logs.length === 0) {
                            console.log(` -> [INFO] El registro de auditoría está vacío. Cadena inmutable lista para la acción.`);
                        } else if (!chainBroken) {
                            console.log(` -> [OK] Inmutabilidad Criptográfica: ${C.green}INTEGRA (Cadena de ${logs.length} firmas validada)${C.reset}`);
                        }
                    } catch (err: any) {
                        console.log(`${C.red}✖ Error al ejecutar diagnóstico de seguridad lógica: ${err.message}${C.reset}`);
                    }
                    break;
                }
                case '0': {
                    console.log('Cerrando conexión de base de datos de ÁRBOL...');
                    running = false;
                    break;
                }
                default:
                    console.log(`${C.red}✖ Opción no válida del menú.${C.reset}`);
            }
        }
    } finally {
        rl.close();
        db.close();
        console.log(`\n${C.green}🟢 [OK] Consola de ÁRBOL by KLIK cerrada limpiamente.${C.reset}`);
    }
}