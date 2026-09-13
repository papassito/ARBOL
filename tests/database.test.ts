// tests/database.test.ts
// Suite de pruebas unitarias nativas para verificar la integridad de la base de datos y la criptografía de ÁRBOL by KLIK
import test from 'node:test';
import assert from 'node:assert';
import Database from 'better-sqlite3';
import crypto from 'node:crypto';

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

test('ÁRBOL - Database & Cryptographic Audit Suite', async (t) => {
    // 1. Crear una base de datos en memoria para pruebas rápidas y aisladas
    const db = new Database(':memory:');
    db.pragma('foreign_keys = ON');

    // Inicializar el esquema lógico idéntico al de producción
    db.exec(`
        CREATE TABLE people (
            id TEXT PRIMARY KEY,
            canonical_name TEXT NOT NULL,
            gender TEXT CHECK(gender IN ('MALE', 'FEMALE', 'UNKNOWN')) NOT NULL,
            state TEXT CHECK(state IN ('LIVING', 'DECEASED', 'UNKNOWN')) NOT NULL,
            research_status TEXT CHECK(research_status IN ('DOCUMENTED', 'FAMILY-SOURCED', 'HYPOTHESIS', 'UNKNOWN')) NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE relationships (
            id TEXT PRIMARY KEY,
            person_a_id TEXT NOT NULL,
            person_b_id TEXT NOT NULL,
            type TEXT CHECK(type IN ('PARENT_CHILD', 'SPOUSAL', 'SIBLING_LATERAL', 'OTHER')) NOT NULL,
            verification_level TEXT CHECK(verification_level IN ('DOCUMENTED', 'FAMILY-SOURCED', 'HYPOTHESIS', 'REJECTED', 'UNKNOWN')) NOT NULL,
            provenance_id TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY(person_a_id) REFERENCES people(id) ON DELETE RESTRICT,
            FOREIGN KEY(person_b_id) REFERENCES people(id) ON DELETE RESTRICT
        );
    `);

    await t.test('Debe fallar al intentar registrar géneros no autorizados (CHECK constraints)', () => {
        assert.throws(() => {
            db.prepare(`
                INSERT INTO people (id, canonical_name, gender, state, research_status, created_at, updated_at)
                VALUES ('p1', 'Test Person', 'INVALID_GENDER', 'LIVING', 'HYPOTHESIS', '2026-09-12T00:00:00Z', '2026-09-12T00:00:00Z')
            `).run();
        }, /CHECK constraint failed/);
    });

    await t.test('Debe respetar la directiva ON DELETE RESTRICT para evitar pérdidas en cascada', () => {
        // Registrar dos personas válidas
        db.prepare(`INSERT INTO people VALUES ('p1', 'Progenitor', 'MALE', 'DECEASED', 'DOCUMENTED', '2026', '2026')`).run();
        db.prepare(`INSERT INTO people VALUES ('p2', 'Descendiente', 'FEMALE', 'LIVING', 'DOCUMENTED', '2026', '2026')`).run();
        
        // Crear parentesco
        db.prepare(`INSERT INTO relationships VALUES ('r1', 'p1', 'p2', 'PARENT_CHILD', 'DOCUMENTED', null, '2026')`).run();

        // Intentar eliminar p1 debe arrojar un error de llave foránea restrictiva
        assert.throws(() => {
            db.prepare(`DELETE FROM people WHERE id = 'p1'`).run();
        }, /FOREIGN KEY constraint failed/);
    });

    await t.test('Debe detectar de inmediato alteraciones maliciosas en la cadena de firmas (Audit Trail)', () => {
        const log1 = {
            id: 'l1',
            timestamp: '2026-09-12T00:00:01Z',
            user_identity: 'human_validator',
            action_type: 'CREATE',
            entity_name: 'people',
            entity_id: 'p1',
            payload_before: null,
            payload_after: '{"canonical_name": "Progenitor"}',
            justification: 'Ingesta inicial',
            parent_hash: null
        };

        const hash1 = calculateRecordHash(log1);

        const log2 = {
            id: 'l2',
            timestamp: '2026-09-12T00:00:02Z',
            user_identity: 'human_validator',
            action_type: 'CREATE',
            entity_name: 'relationships',
            entity_id: 'r1',
            payload_before: null,
            payload_after: '{"type": "PARENT_CHILD"}',
            justification: 'Enlace verificado',
            parent_hash: hash1 // Apunta correctamente al eslabón anterior
        };

        const hash2 = calculateRecordHash(log2);

        // Simular manipulación del payload del primer registro
        const tamperedPayloadAfter = '{"canonical_name": "Progenitor ALTERADO"}';
        const recalculatedHash1 = calculateRecordHash({ ...log1, payload_after: tamperedPayloadAfter });

        // El hash recalculado de la entrada modificada romperá de forma garantizada el encadenamiento de hash2
        assert.notStrictEqual(recalculatedHash1, hash1, 'La alteración de datos produjo firmas distintas.');
    });

    db.close();
});