// c:\Users\CMSoluciones\Documents\ARBOL\src\api\server.ts
// Servidor Web Local-First Cero-Dependencias e Interfaz Gráfica para ÁRBOL by KLIK
import http from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
// Función auxiliar para calcular firmas digitales de auditoría exactamente igual al Core
function calculateRecordHash(log) {
    const payload = log.id + log.timestamp + log.user_identity + log.action_type +
        log.entity_name + log.entity_id + (log.payload_before || '') +
        log.payload_after + log.justification + (log.parent_hash || '');
    return crypto.createHash('sha256').update(payload).digest('hex');
}
// Escribir entrada segura y encadenada en el Audit Log
function logAuditAction(db, action, entityName, entityId, payloadBefore, payloadAfter, justification) {
    const id = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    const userIdentity = 'web_interface';
    const lastLog = db.prepare('SELECT record_hash FROM audit_log ORDER BY timestamp DESC LIMIT 1').get();
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
function getRequestBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => resolve(body));
        req.on('error', err => reject(err));
    });
}
export function startWebServer(db, port = 3000) {
    const server = http.createServer(async (req, res) => {
        const url = new URL(req.url || '', `http://${req.headers.host}`);
        const method = req.method;
        // Cabeceras CORS y Content-Type por defecto para APIs
        const jsonHeaders = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
        try {
            // Preflight CORS para el WebView2 de Wails.
            if (method === 'OPTIONS') {
                res.writeHead(204, {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                });
                res.end();
                return;
            }
            // Diagnóstico liviano usado por la aplicación desktop.
            if (url.pathname === '/api/health' && method === 'GET') {
                res.writeHead(200, jsonHeaders);
                res.end(JSON.stringify({ ok: true, service: 'arbol-local-api' }));
                return;
            }
            // 1. RUTA MAESTRA: Servidor de Interfaz Gráfica (HTML, CSS y JS unificados)
            if (url.pathname === '/' && method === 'GET') {
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(getHtmlDashboard());
                return;
            }
            // 2. API: Listar personas
            if (url.pathname === '/api/people' && method === 'GET') {
                const people = db.prepare('SELECT * FROM people ORDER BY canonical_name ASC').all();
                res.writeHead(200, jsonHeaders);
                res.end(JSON.stringify(people));
                return;
            }
            // 3. API: Registrar nueva persona (Transaccional)
            if (url.pathname === '/api/people' && method === 'POST') {
                const body = await getRequestBody(req);
                const { canonical_name, gender, research_status, justification } = JSON.parse(body);
                if (!canonical_name || !gender || !research_status || !justification) {
                    res.writeHead(400, jsonHeaders);
                    res.end(JSON.stringify({ error: 'Faltan parámetros requeridos.' }));
                    return;
                }
                const id = crypto.randomUUID();
                const now = new Date().toISOString();
                const registerTx = db.transaction(() => {
                    db.prepare(`
                        INSERT INTO people (id, canonical_name, gender, state, research_status, created_at, updated_at)
                        VALUES (?, ?, ?, 'UNKNOWN', ?, ?, ?)
                    `).run(id, canonical_name, gender, research_status, now, now);
                    logAuditAction(db, 'CREATE', 'people', id, null, JSON.stringify({ canonical_name, gender, research_status }), justification);
                });
                registerTx();
                res.writeHead(201, jsonHeaders);
                res.end(JSON.stringify({ success: true, id }));
                return;
            }
            // 3a. API: Actualizar persona existente (Transaccional)
            if (url.pathname === '/api/people' && method === 'PUT') {
                const body = await getRequestBody(req);
                const { id, canonical_name, gender, state, research_status, justification } = JSON.parse(body);
                if (!id || !canonical_name || !gender || !state || !research_status || !justification) {
                    res.writeHead(400, jsonHeaders);
                    res.end(JSON.stringify({ error: 'Faltan parámetros requeridos para actualizar la persona.' }));
                    return;
                }
                const before = db.prepare('SELECT * FROM people WHERE id = ?').get(id);
                if (!before) {
                    res.writeHead(404, jsonHeaders);
                    res.end(JSON.stringify({ error: 'Persona no encontrada.' }));
                    return;
                }
                const now = new Date().toISOString();
                const updateTx = db.transaction(() => {
                    db.prepare(`
                        UPDATE people
                        SET canonical_name = ?, gender = ?, state = ?, research_status = ?, updated_at = ?
                        WHERE id = ?
                    `).run(canonical_name, gender, state, research_status, now, id);
                    logAuditAction(db, 'UPDATE', 'people', id, JSON.stringify(before), JSON.stringify({ canonical_name, gender, state, research_status, updated_at: now }), justification);
                });
                updateTx();
                res.writeHead(200, jsonHeaders);
                res.end(JSON.stringify({ success: true, id }));
                return;
            }
            // 3b. API: Añadir Evento Histórico (Transaccional)
            if (url.pathname === '/api/events' && method === 'POST') {
                const body = await getRequestBody(req);
                const { person_id, type, event_year, event_month, event_day, is_approximate, justification } = JSON.parse(body);
                if (!person_id || !type || !event_year || !justification) {
                    res.writeHead(400, jsonHeaders);
                    res.end(JSON.stringify({ error: 'Faltan parámetros obligatorios.' }));
                    return;
                }
                const id = crypto.randomUUID();
                const eventTx = db.transaction(() => {
                    db.prepare(`
                        INSERT INTO events (id, person_id, type, event_year, event_month, event_day, is_approximate)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    `).run(id, person_id, type, parseInt(event_year), event_month ? parseInt(event_month) : null, event_day ? parseInt(event_day) : null, is_approximate ? 1 : 0);
                    logAuditAction(db, 'CREATE', 'events', id, null, JSON.stringify({ person_id, type, event_year }), justification);
                });
                eventTx();
                res.writeHead(201, jsonHeaders);
                res.end(JSON.stringify({ success: true, id }));
                return;
            }
            // 3c. API: Añadir Evidencia / Foto Familiar (Transaccional)
            if (url.pathname === '/api/evidence' && method === 'POST') {
                const body = await getRequestBody(req);
                const { person_id, type, confidence_rating, file_hash, file_path, transcription, source_name, justification } = JSON.parse(body);
                if (!person_id || !type || !confidence_rating || !source_name || !justification) {
                    res.writeHead(400, jsonHeaders);
                    res.end(JSON.stringify({ error: 'Faltan parámetros obligatorios.' }));
                    return;
                }
                const sourceId = crypto.randomUUID();
                const evidenceId = crypto.randomUUID();
                const evidenceTx = db.transaction(() => {
                    // Crear la fuente asociada si no existe
                    db.prepare(`
                        INSERT INTO sources (id, name, classification)
                        VALUES (?, ?, 'PRIMARY')
                    `).run(sourceId, source_name);
                    // Insertar la evidencia
                    db.prepare(`
                        INSERT INTO evidence (id, source_id, type, confidence_rating, file_hash, file_path, transcription)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    `).run(evidenceId, sourceId, type, confidence_rating, file_hash || null, file_path || null, transcription || null);
                    // Vincular la evidencia con la persona
                    db.prepare(`
                        INSERT INTO evidence_people_links (evidence_id, person_id)
                        VALUES (?, ?)
                    `).run(evidenceId, person_id);
                    logAuditAction(db, 'CREATE', 'evidence', evidenceId, null, JSON.stringify({ type, file_path }), justification);
                });
                evidenceTx();
                res.writeHead(201, jsonHeaders);
                res.end(JSON.stringify({ success: true, id: evidenceId }));
                return;
            }
            // 3d. API: Obtener Evidencias de una Persona
            if (url.pathname === '/api/evidence' && method === 'GET') {
                const personId = url.searchParams.get('person_id');
                const evidence = db.prepare(`
                    SELECT e.*, s.name as source_name FROM evidence e
                    JOIN evidence_people_links l ON e.id = l.evidence_id
                    JOIN sources s ON e.source_id = s.id
                    WHERE l.person_id = ?
                `).all(personId);
                res.writeHead(200, jsonHeaders);
                res.end(JSON.stringify(evidence));
                return;
            }
            // 3e. API: Obtener Línea Temporal / Eventos de una Persona
            if (url.pathname === '/api/timeline' && method === 'GET') {
                const personId = url.searchParams.get('person_id');
                const events = db.prepare(`
                    SELECT * FROM events 
                    WHERE person_id = ? 
                    ORDER BY event_year ASC, event_month ASC, event_day ASC
                `).all(personId);
                res.writeHead(200, jsonHeaders);
                res.end(JSON.stringify(events));
                return;
            }
            // 3f. API: Guardado de Foto Rápida Unificada (Transaccional)
            if (url.pathname === '/api/quick-photo' && method === 'POST') {
                const body = await getRequestBody(req);
                const { original_base64, clean_base64, tagged_people_ids, event_year, event_month, event_day, is_approximate, place_id, note, justification } = JSON.parse(body);
                if (!original_base64 || !clean_base64 || !justification) {
                    res.writeHead(400, jsonHeaders);
                    res.end(JSON.stringify({ error: 'Faltan parámetros obligatorios de la fotografía.' }));
                    return;
                }
                const originalId = crypto.randomUUID();
                const cleanId = crypto.randomUUID();
                const sourceId = crypto.randomUUID();
                const originalPath = `blob_store/photos/original_${originalId}.png`;
                const cleanPath = `blob_store/photos/clean_${cleanId}.png`;
                const origData = original_base64.replace(/^data:image\/\w+;base64,/, "");
                const cleanData = clean_base64.replace(/^data:image\/\w+;base64,/, "");
                fs.mkdirSync(path.join(process.cwd(), 'blob_store', 'photos'), { recursive: true });
                fs.writeFileSync(path.join(process.cwd(), originalPath), Buffer.from(origData, 'base64'));
                fs.writeFileSync(path.join(process.cwd(), cleanPath), Buffer.from(cleanData, 'base64'));
                const quickPhotoTx = db.transaction(() => {
                    db.prepare(`
                        INSERT INTO sources (id, name, classification)
                        VALUES (?, ?, 'PRIMARY')
                    `).run(sourceId, note || 'Foto familiar rápida preservada');
                    db.prepare(`
                        INSERT INTO evidence (id, source_id, type, confidence_rating, file_hash, file_path, transcription)
                        VALUES (?, ?, 'PHOTO', 'HIGH', ?, ?, 'Foto original preservada')
                    `).run(originalId, sourceId, crypto.createHash('sha256').update(origData).digest('hex'), originalPath);
                    db.prepare(`
                        INSERT INTO evidence (id, source_id, type, confidence_rating, file_hash, file_path, transcription)
                        VALUES (?, ?, 'PHOTO', 'HIGH', ?, ?, 'Versión limpia (Zero AI)')
                    `).run(cleanId, sourceId, crypto.createHash('sha256').update(cleanData).digest('hex'), cleanPath);
                    if (Array.isArray(tagged_people_ids)) {
                        for (const personId of tagged_people_ids) {
                            db.prepare(`INSERT INTO evidence_people_links (evidence_id, person_id) VALUES (?, ?)`).run(originalId, personId);
                            db.prepare(`INSERT INTO evidence_people_links (evidence_id, person_id) VALUES (?, ?)`).run(cleanId, personId);
                        }
                    }
                    logAuditAction(db, 'CREATE', 'evidence', cleanId, null, JSON.stringify({ originalPath, cleanPath, tagged_people_ids }), justification);
                });
                quickPhotoTx();
                res.writeHead(201, jsonHeaders);
                res.end(JSON.stringify({ success: true, originalEvidenceId: originalId, cleanEvidenceId: cleanId }));
                return;
            }
            // 4. API: Listar relaciones
            if (url.pathname === '/api/relationships' && method === 'GET') {
                const relationships = db.prepare('SELECT * FROM relationships ORDER BY created_at ASC').all();
                res.writeHead(200, jsonHeaders);
                res.end(JSON.stringify(relationships));
                return;
            }
            // 4b. API: Establecer nueva relación (Transaccional)
            if (url.pathname === '/api/relationships' && method === 'POST') {
                const body = await getRequestBody(req);
                const { person_a_id, person_b_id, type, verification_level, justification } = JSON.parse(body);
                if (!person_a_id || !person_b_id || !type || !verification_level || !justification) {
                    res.writeHead(400, jsonHeaders);
                    res.end(JSON.stringify({ error: 'Faltan parámetros requeridos.' }));
                    return;
                }
                const id = crypto.randomUUID();
                const now = new Date().toISOString();
                const linkTx = db.transaction(() => {
                    db.prepare(`
                        INSERT INTO relationships (id, person_a_id, person_b_id, type, verification_level, created_at)
                        VALUES (?, ?, ?, ?, ?, ?)
                    `).run(id, person_a_id, person_b_id, type, verification_level, now);
                    logAuditAction(db, 'LINK', 'relationships', id, null, JSON.stringify({ person_a_id, person_b_id, type }), justification);
                });
                linkTx();
                res.writeHead(201, jsonHeaders);
                res.end(JSON.stringify({ success: true, id }));
                return;
            }
            // 5. API: Ver historial de Auditoría
            if (url.pathname === '/api/audit' && method === 'GET') {
                const logs = db.prepare('SELECT * FROM audit_log ORDER BY timestamp DESC').all();
                res.writeHead(200, jsonHeaders);
                res.end(JSON.stringify(logs));
                return;
            }
            // 6. API: Árbol Genealógico focalizado por persona
            if (url.pathname === '/api/tree-focus' && method === 'GET') {
                const personId = url.searchParams.get('id');
                if (!personId) {
                    res.writeHead(400, jsonHeaders);
                    res.end(JSON.stringify({ error: 'ID de persona es obligatorio.' }));
                    return;
                }
                const person = db.prepare('SELECT * FROM people WHERE id = ?').get(personId);
                if (!person) {
                    res.writeHead(404, jsonHeaders);
                    res.end(JSON.stringify({ error: 'Persona no encontrada.' }));
                    return;
                }
                // Padres (Ancestros directos)
                const parents = db.prepare(`
                    SELECT p.*, r.verification_level FROM people p
                    JOIN relationships r ON (p.id = r.person_a_id AND r.person_b_id = ?)
                    WHERE r.type = 'PARENT_CHILD'
                `).all(personId);
                // Cónyuges/Parejas
                const spouses = db.prepare(`
                    SELECT p.*, r.verification_level FROM people p
                    JOIN relationships r ON ((p.id = r.person_b_id AND r.person_a_id = ?) OR (p.id = r.person_a_id AND r.person_b_id = ?))
                    WHERE r.type = 'SPOUSAL'
                `).all(personId, personId);
                // Hijos (Descendencia)
                const children = db.prepare(`
                    SELECT p.*, r.verification_level FROM people p
                    JOIN relationships r ON p.id = r.person_b_id
                    WHERE r.person_a_id = ? AND r.type = 'PARENT_CHILD'
                `).all(personId);
                // Hermanos (Mismo padre/madre)
                const siblings = db.prepare(`
                    SELECT DISTINCT p.* FROM people p
                    JOIN relationships r1 ON p.id = r1.person_b_id
                    JOIN relationships r2 ON r1.person_a_id = r2.person_a_id
                    WHERE r2.person_b_id = ? 
                      AND p.id != ? 
                      AND r1.type = 'PARENT_CHILD' 
                      AND r2.type = 'PARENT_CHILD'
                `).all(personId, personId);
                res.writeHead(200, jsonHeaders);
                res.end(JSON.stringify({ person, parents, spouses, children, siblings }));
                return;
            }
            // 7. API: Diagnóstico de Integridad Criptográfica
            if (url.pathname === '/api/diagnose' && method === 'GET') {
                const integrity = db.prepare('PRAGMA integrity_check').get();
                const fkCheck = db.prepare('PRAGMA foreign_key_check').all();
                const logs = db.prepare('SELECT * FROM audit_log ORDER BY timestamp ASC').all();
                let chainBroken = false;
                let computedParentHash = null;
                for (let i = 0; i < logs.length; i++) {
                    const log = logs[i];
                    const hash = calculateRecordHash(log);
                    if (hash !== log.record_hash || (i > 0 && log.parent_hash !== computedParentHash)) {
                        chainBroken = true;
                        break;
                    }
                    computedParentHash = log.record_hash;
                }
                res.writeHead(200, jsonHeaders);
                res.end(JSON.stringify({
                    integrity: integrity ? integrity.integrity_check : 'error',
                    foreignKeys: fkCheck.length === 0 ? 'ok' : 'violated',
                    cryptographicAudit: !chainBroken ? 'intact' : 'compromised',
                    logCount: logs.length
                }));
                return;
            }
            // Ruta no encontrada
            res.writeHead(404, jsonHeaders);
            res.end(JSON.stringify({ error: 'Ruta no encontrada.' }));
        }
        catch (err) {
            res.writeHead(500, jsonHeaders);
            res.end(JSON.stringify({ error: err.message }));
        }
    });
    server.listen(port, '127.0.0.1', () => {
        console.log(`\n👉 [WEB GUI] Interfaz gráfica de ÁRBOL activa en: http://localhost:${port}`);
    });
}
function getHtmlDashboard() {
    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>ÁRBOL by KLIK - Álbum y Árbol Familiar</title>
    <style>
        :root {
            --bg-main: #0f172a;
            --bg-card: #1e293b;
            --border-color: #334155;
            --text-main: #f8fafc;
            --text-muted: #94a3b8;
            --accent: #0ea5e9;
            --green: #10b981;
            --yellow: #f59e0b;
            --red: #ef4444;
            --purple: #a855f7;
        }
        body {
            margin: 0;
            font-family: system-ui, -apple-system, sans-serif;
            background-color: var(--bg-main);
            color: var(--text-main);
        }
        header {
            background-color: var(--bg-card);
            padding: 1rem 2rem;
            border-bottom: 1px solid var(--border-color);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        h1 { margin: 0; font-size: 1.5rem; color: var(--accent); }
        .container { display: grid; grid-template-columns: 300px 1fr; height: calc(100vh - 70px); }
        .sidebar { background-color: #0b0f19; border-right: 1px solid var(--border-color); padding: 1.5rem; overflow-y: auto; }
        .main-panel { padding: 2rem; overflow-y: auto; }
        .btn { background-color: var(--accent); color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; font-weight: bold; }
        .btn:hover { opacity: 0.9; }
        .form-group { margin-bottom: 1rem; display: flex; flex-direction: column; }
        .form-group label { margin-bottom: 0.25rem; font-size: 0.85rem; color: var(--text-muted); }
        .form-group input, .form-group select { background-color: var(--bg-main); border: 1px solid var(--border-color); padding: 0.5rem; color: white; border-radius: 4px; }
        .badge { display: inline-block; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: bold; }
        .badge-green { background-color: rgba(16, 185, 129, 0.2); color: var(--green); }
        .badge-yellow { background-color: rgba(245, 158, 11, 0.2); color: var(--yellow); }
        .badge-red { background-color: rgba(239, 68, 68, 0.2); color: var(--red); }
        
        /* Tree Visualization Styles */
        .tree-container { display: flex; flex-direction: column; align-items: center; margin-top: 2rem; gap: 2rem; }
        .tree-row { display: flex; justify-content: center; gap: 1.5rem; width: 100%; }
        .tree-node { background-color: var(--bg-card); border: 1px solid var(--border-color); padding: 1rem; border-radius: 8px; width: 220px; text-align: center; cursor: pointer; transition: transform 0.2s; position: relative; }
        .tree-node:hover { transform: scale(1.05); border-color: var(--accent); }
        .tree-node.focus { border: 2px solid var(--accent); box-shadow: 0 0 10px rgba(14, 165, 233, 0.3); }
        .tree-node .node-role { font-size: 0.7rem; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.25rem; }
        .tree-node .node-name { font-weight: bold; font-size: 0.95rem; }
        .tree-arrow { color: var(--border-color); font-size: 1.5rem; }
        
        .tabs { display: flex; gap: 1rem; margin-bottom: 2rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem; }
        .tab { cursor: pointer; padding: 0.5rem 1rem; color: var(--text-muted); font-weight: bold; }
        .tab.active { color: var(--accent); border-bottom: 2px solid var(--accent); }
        .panel-section { display: none; }
        .panel-section.active { display: block; }
    </style>
</head>
<body>
    <header>
        <h1>🌳 ÁRBOL by KLIK :: local-first geneology</h1>
        <div style="display:flex; gap:10px; align-items:center;">
            <span id="diagnostic-status" class="badge badge-green">Cargando Diagnóstico...</span>
            <button class="btn" onclick="runDiagnosis()">Ejecutar Diagnóstico Forense</button>
        </div>
    </header>
    <div class="container">
        <div class="sidebar">
            <h3>👥 Integrantes Saneados</h3>
            <div id="people-list" style="display:flex; flex-direction:column; gap:8px;"></div>
        </div>
        <div class="main-panel">
            <div class="tabs">
                <div class="tab active" onclick="switchTab('tree-tab')">🌳 Árbol Familiar</div>
                <div class="tab" onclick="switchTab('quick-photo-tab')">📸 Foto rápida</div>
                <div class="tab" onclick="switchTab('register-tab')">➕ Agregar información</div>
                <div class="tab" onclick="switchTab('audit-tab')">📜 Historial de cambios</div>
            </div>

            <!-- Árbol Genealógico -->
            <div id="tree-tab" class="panel-section active">
                <h3>Navegación Generacional Focalizada</h3>
                <div class="tree-container" id="tree-visualization">
                    <div style="color: var(--text-muted);">Selecciona un integrante de la lista lateral para explorar y focalizar su parentesco familiar.</div>
                </div>
            </div>

            <!-- Nueva pestaña: Foto rápida asistida de 4 pasos -->
            <div id="quick-photo-tab" class="panel-section">
                <div style="background-color: var(--bg-card); padding: 1rem 2rem; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-around; align-items: center; font-weight: bold; font-size: 0.95rem;">
                    <span id="step-nav-1" style="color: var(--accent);">① Ingresa</span>
                    <span style="color: var(--border-color);">➔</span>
                    <span id="step-nav-2" style="color: var(--text-muted);">② Marca</span>
                    <span style="color: var(--border-color);">➔</span>
                    <span id="step-nav-3" style="color: var(--text-muted);">③ Limpia</span>
                    <span style="color: var(--border-color);">➔</span>
                    <span id="step-nav-4" style="color: var(--text-muted);">④ Coloca</span>
                </div>

                <div style="padding: 2rem; display: flex; flex-direction: column; align-items: center; height: calc(100% - 60px); overflow-y: auto; box-sizing: border-box;">
                    
                    <!-- Paso 1: INGRESAS -->
                    <div id="step-content-1" style="display: flex; flex-direction: column; align-items: center; gap: 1.5rem; width: 100%; max-width: 600px;">
                        <div id="quick-dropzone" style="width: 100%; height: 250px; border: 2px dashed var(--border-color); border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; cursor: pointer; background-color: #0b0f19;" onclick="triggerFileInput()" ondragover="event.preventDefault()" ondrop="handlePhotoDrop(event)">
                            <span style="font-size: 3rem;">📸</span>
                            <span style="color: var(--text-muted); text-align: center; padding: 0 1rem;">Arrastra una foto aquí, búscala en tu computadora, tómala con la cámara o pégala directamente (Ctrl+V)</span>
                            <input type="file" id="quick-file-input" style="display: none;" accept="image/*" onchange="handlePhotoFile(event)">
                        </div>
                        <div style="display: flex; gap: 1rem;">
                            <button class="btn" onclick="initWebcam()">Usar Cámara</button>
                        </div>
                        <div id="camera-container" style="display: none; flex-direction: column; gap: 1rem; align-items: center;">
                            <video id="webcam" autoplay playsinline style="width: 320px; height: 240px; border-radius: 6px; background-color: black; transform: scaleX(-1);"></video>
                            <button class="btn" onclick="captureWebcam()">Tomar foto</button>
                        </div>
                        <div id="preview-container-1" style="display: none; align-items: center; flex-direction: column; gap: 0.5rem;">
                            <img id="preview-img-1" style="max-height: 200px; border-radius: 6px; border: 1px solid var(--border-color);" alt="Vista previa original">
                            <span class="badge badge-green">Foto original preservada</span>
                            <button class="btn" style="margin-top: 1rem;" onclick="goToStep(2)">Siguiente: Marcar familiares ➜</button>
                        </div>
                    </div>

                    <!-- Paso 2: MARCAS -->
                    <div id="step-content-2" style="display: none; flex-direction: column; align-items: center; gap: 1.5rem; width: 100%;">
                        <p style="color: var(--text-muted); text-align: center; margin: 0;">Haz clic sobre la fotografía en el lugar donde aparece un familiar para identificarlo.</p>
                        <div style="position: relative; display: inline-block; max-width: 90%; background-color: #0b0f19; border-radius: 8px; border: 1px solid var(--border-color); overflow: hidden;">
                            <img id="preview-img-2" style="max-height: 450px; display: block; cursor: crosshair;" onclick="placeMarker(event)" alt="Marcar personas">
                            <div id="marker-overlay-container" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;"></div>
                        </div>
                        <div style="width: 100%; max-width: 500px; background-color: var(--bg-card); padding: 1rem; border-radius: 6px; border: 1px solid var(--border-color);">
                            <h4 style="margin-top: 0;">Familiares identificados en esta foto:</h4>
                            <div id="tagged-list" style="display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1rem;"></div>
                            <button class="btn" onclick="goToStep(3)">Siguiente: Limpiar foto ➜</button>
                        </div>
                    </div>

                    <!-- Paso 3: LIMPIAS -->
                    <div id="step-content-3" style="display: none; flex-direction: column; align-items: center; gap: 1.5rem; width: 100%;">
                        <div style="display: flex; gap: 2rem; justify-content: center; flex-wrap: wrap; width: 100%;">
                            <!-- Original -->
                            <div style="text-align: center;">
                                <h4 style="color: var(--text-muted); margin-bottom: 0.5rem;">Original</h4>
                                <img id="preview-img-3" style="max-height: 350px; border-radius: 6px; border: 1px solid var(--border-color);" alt="Original">
                            </div>
                            <!-- Limpia -->
                            <div style="text-align: center;">
                                <h4 style="color: var(--green); margin-bottom: 0.5rem;">Limpia (Zero AI)</h4>
                                <img id="preview-clean-img" style="max-height: 350px; border-radius: 6px; border: 2px solid var(--green);" alt="Limpia">
                            </div>
                        </div>
                        <div style="width: 100%; max-width: 600px; background-color: var(--bg-card); padding: 1.5rem; border-radius: 8px; border: 1px solid var(--border-color); display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                            <div>
                                <h4 style="margin-top: 0; color: var(--accent);">Ajustes de revelado</h4>
                                <div class="form-group">
                                    <label>Rotación</label>
                                    <button class="btn" style="background-color: var(--bg-main); border: 1px solid var(--border-color);" onclick="rotatePhoto()">Girar 90°</button>
                                </div>
                                <div class="form-group">
                                    <label>Brillo</label>
                                    <input type="range" id="slide-brightness" min="-100" max="100" value="0" oninput="applyFilters()">
                                </div>
                                <div class="form-group">
                                    <label>Contraste</label>
                                    <input type="range" id="slide-contrast" min="50" max="150" value="100" oninput="applyFilters()">
                                </div>
                            </div>
                            <div>
                                <h4 style="margin-top: 0; color: var(--accent);">Corrección de tono</h4>
                                <div class="form-group" style="flex-direction: row; gap: 10px; align-items: center; margin-bottom: 0.5rem;">
                                    <input type="checkbox" id="check-grayscale" onchange="applyFilters()">
                                    <label for="check-grayscale" style="margin: 0; cursor: pointer;">Escala de grises</label>
                                </div>
                                <div class="form-group" style="flex-direction: row; gap: 10px; align-items: center;">
                                    <input type="checkbox" id="check-sepia" onchange="applyFilters()">
                                    <label for="check-sepia" style="margin: 0; cursor: pointer;">Tono antiguo (Sepia)</label>
                                </div>
                                <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 1rem; border-top: 1px solid var(--border-color); padding-top: 0.5rem; line-height: 1.3;">
                                    <strong>ZERO IA:</strong> Esta herramienta solo ajusta colores y contraste. No se reconstruyen ni inventan rasgos, rostros, fondos u objetos ausentes.
                                </p>
                            </div>
                        </div>
                        <canvas id="filter-canvas" style="display: none;"></canvas>
                        <button class="btn" onclick="goToStep(4)">Siguiente: Guardar en el árbol ➜</button>
                    </div>

                    <!-- Paso 4: COLOCAS -->
                    <div id="step-content-4" style="display: none; flex-direction: column; align-items: center; gap: 1.5rem; width: 100%; max-width: 500px;">
                        <h3 style="margin: 0; color: var(--green);">¡Todo listo para guardar!</h3>
                        <div style="display: flex; gap: 1rem; align-items: center; background-color: #0b0f19; padding: 1rem; border-radius: 6px; border: 1px solid var(--border-color); width: 100%;">
                            <img id="preview-final-img" style="width: 80px; height: 80px; object-fit: cover; border-radius: 4px; border: 1px solid var(--border-color);">
                            <div>
                                <h4 style="margin: 0; font-size: 0.9rem;">Foto lista para guardar</h4>
                                <p style="margin: 0.25rem 0 0; font-size: 0.8rem; color: var(--text-muted);" id="final-tags-count">0 familiares marcados</p>
                            </div>
                        </div>
                        <form id="placement-form" onsubmit="saveQuickPhoto(event)" style="width: 100%;">
                            <div class="form-group">
                                <label>Año (Rango de fecha aproximada si no es exacto)</label>
                                <input type="number" id="qp-year" placeholder="ej. 1950">
                            </div>
                            <div class="form-group" style="flex-direction: row; gap: 10px; align-items: center; margin-bottom: 1rem;">
                                <input type="checkbox" id="qp-approximate">
                                <label for="qp-approximate" style="margin: 0; cursor: pointer;">Fecha aproximada</label>
                            </div>
                            <div class="form-group">
                                <label>Lugar o procedencia geográfica</label>
                                <input type="text" id="qp-place" placeholder="ej. Sonora, México">
                            </div>
                            <div class="form-group">
                                <label>Nota de recuerdo o descripción</label>
                                <input type="text" id="qp-note" required placeholder="ej. Retrato de boda familiar o reunión en casa">
                            </div>
                            <div class="form-group">
                                <label>Fuente o nota (Requerido para historial de cambios)</label>
                                <input type="text" id="qp-justification" required placeholder="ej. Entregado por la abuela de su baúl de recuerdos">
                            </div>
                            <button type="submit" class="btn" style="width: 100%; padding: 0.75rem; background-color: var(--green);">Guardar en el árbol</button>
                        </form>
                    </div>
                </div>
            </div>

            <!-- Modal rápido para agregar personas desde el marcador de fotos -->
            <div id="quick-person-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.7); z-index: 1000; align-items: center; justify-content: center;">
                <div style="background-color: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; width: 350px; padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem;">
                    <h3 style="margin-top: 0; font-size: 1.1rem; color: var(--accent);">➕ Agregar persona</h3>
                    <div class="form-group" style="margin: 0;">
                        <label>Nombre completo</label>
                        <input type="text" id="qp-new-name" required placeholder="ej. GivenName-Alpha Surname-Beta">
                    </div>
                    <div class="form-group" style="margin: 0;">
                        <label>Género</label>
                        <select id="qp-new-gender">
                            <option value="MALE">Masculino</option>
                            <option value="FEMALE">Femenino</option>
                            <option value="UNKNOWN">Desconocido</option>
                        </select>
                    </div>
                    <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                        <button class="btn" style="background-color: transparent; border: 1px solid var(--border-color); color: white;" onclick="closeQuickPersonModal()">Cancelar</button>
                        <button class="btn" onclick="saveQuickPerson()">Guardar</button>
                    </div>
                </div>
            </div>

            <!-- Registro / Ingesta -->
            <div id="register-tab" class="panel-section">
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:2rem;">
                    <div>
                        <h3>Registrar Identidad Genérica (Zero Synthetic)</h3>
                        <form id="person-form" onsubmit="registerPerson(event)">
                            <div class="form-group">
                                <label>Nombre Canónico Completo</label>
                                <input type="text" id="p-name" required placeholder="ej. GivenName-Alpha Surname-Beta">
                            </div>
                            <div class="form-group">
                                <label>Género</label>
                                <select id="p-gender">
                                    <option value="MALE">Masculino (MALE)</option>
                                    <option value="FEMALE">Femenino (FEMALE)</option>
                                    <option value="UNKNOWN">Desconocido (UNKNOWN)</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Estado de la información</label>
                                <select id="p-status">
                                    <option value="DOCUMENTED">Confirmado con documento (DOCUMENTED)</option>
                                    <option value="FAMILY-SOURCED">Información familiar (FAMILY-SOURCED)</option>
                                    <option value="HYPOTHESIS" selected>Por confirmar (HYPOTHESIS)</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Fuente o nota</label>
                                <input type="text" id="p-justification" required placeholder="Nota o fuente que justifica agregar a esta persona...">
                            </div>
                            <button type="submit" class="btn">Guardar persona</button>
                        </form>
                    </div>
                    <div>
                        <h3 style="margin-top:0;">Agregar parentesco</h3>
                        <form id="relation-form" onsubmit="linkRelationship(event)">
                            <div class="form-group">
                                <label>Primera persona</label>
                                <select id="rel-a" required></select>
                            </div>
                            <div class="form-group">
                                <label>Segunda persona</label>
                                <select id="rel-b" required></select>
                            </div>
                            <div class="form-group">
                                <label>Parentesco</label>
                                <select id="rel-type">
                                    <option value="PARENT_CHILD">Padre/Madre -> Hijo/a (PARENT_CHILD)</option>
                                    <option value="SPOUSAL">Matrimonio/Pareja (SPOUSAL)</option>
                                    <option value="SIBLING_LATERAL">Vínculo Lateral/Hermanos (SIBLING_LATERAL)</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Estado</label>
                                <select id="rel-status">
                                    <option value="DOCUMENTED">Confirmado con documento (DOCUMENTED)</option>
                                    <option value="FAMILY-SOURCED">Información familiar (FAMILY-SOURCED)</option>
                                    <option value="HYPOTHESIS">Por confirmar (HYPOTHESIS)</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Fuente o nota</label>
                                <input type="text" id="rel-justification" required placeholder="Evidencia que justifica la relación...">
                            </div>
                            <button type="submit" class="btn">Guardar parentesco</button>
                        </form>
                    </div>
                </div>
            </div>

            <!-- Cadena de Auditoría -->
            <div id="audit-tab" class="panel-section">
                <h3 style="padding: 1.5rem 2rem 0; margin: 0;">Historial de cambios</h3>
                <div style="background-color:#0b0f19; border:1px solid var(--border-color); border-radius:6px; padding:1rem; max-height:400px; overflow-y:auto;">
                    <table style="width:100%; border-collapse:collapse; text-align:left; font-size:0.85rem;">
                        <thead>
                            <tr style="border-bottom:1px solid var(--border-color); color:var(--text-muted);">
                                <th style="padding:0.5rem;">Identificador</th>
                                <th style="padding:0.5rem;">Acción</th>
                                <th style="padding:0.5rem;">Sección</th>
                                <th style="padding:0.5rem;">Fuente o nota</th>
                                <th style="padding:0.5rem;">Firma digital</th>
                            </tr>
                        </thead>
                        <tbody id="audit-rows"></tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Ficha Lateral de Detalles del Integrante (Drawer) -->
        <div class="details-drawer" id="details-drawer">
            <div class="drawer-header">
                <h3 style="margin:0; font-size:1.1rem; color:var(--accent);">🔍 Información de la persona</h3>
                <button class="toolbar-btn" style="font-size:1.5rem;" onclick="closeDrawer()">×</button>
            </div>
            <div class="drawer-content">
                <!-- Foto y metadatos -->
                <div class="drawer-photo-viewer">
                    <div class="drawer-photo-box" id="d-photo">👤</div>
                    <div class="drawer-photo-meta" id="d-photo-meta">
                        <span class="badge badge-green">Foto original</span>
                    </div>
                </div>

                <!-- Información Identitaria -->
                <div>
                    <h4 style="margin: 0 0 0.5rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.25rem;">Datos personales</h4>
                    <div style="font-size: 1.1rem; font-weight: bold;" id="d-canonical-name">-</div>
                    <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem;" id="d-gender-state">-</div>
                    <div style="margin-top: 0.5rem;" id="d-status-badge"></div>
                </div>

                <!-- Línea Temporal del Integrante -->
                <div>
                    <h4 style="margin: 0 0 0.5rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.25rem; display:flex; justify-content:space-between; align-items:center;">
                        <span>⏳ Línea temporal</span>
                        <button class="btn" style="padding:0.15rem 0.5rem; font-size:0.75rem;" onclick="openAddEventForm()">+ Añadir Hito</button>
                    </h4>
                    <div class="timeline-container" id="timeline-box"></div>
                </div>

                <!-- Formulario Añadir Evento (Escondido por defecto) -->
                <div id="add-event-form-box" style="display:none; background-color:var(--bg-main); padding:1rem; border-radius:6px; border:1px solid var(--border-color);">
                    <h4 style="margin-top:0;">Añadir Hito Vital</h4>
                    <form onsubmit="saveEvent(event)">
                        <div class="form-group">
                            <label>Hito</label>
                            <select id="e-type" required>
                                <option value="BIRTH">Nacimiento (BIRTH)</option>
                                <option value="BAPTISM">Bautismo (BAPTISM)</option>
                                <option value="MARRIAGE">Matrimonio (MARRIAGE)</option>
                                <option value="DEATH">Defunción (DEATH)</option>
                                <option value="BURIAL">Sepelio (BURIAL)</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Año</label>
                            <input type="number" id="e-year" required>
                        </div>
                        <div class="form-group">
                            <label>Mes</label>
                            <input type="number" id="e-month" min="1" max="12">
                        </div>
                        <div class="form-group">
                            <label>Día</label>
                            <input type="number" id="e-day" min="1" max="31">
                        </div>
                        <div class="form-group">
                            <label>Fuente o nota</label>
                            <input type="text" id="e-justification" required>
                        </div>
                        <button type="submit" class="btn">Guardar Hito</button>
                        <button type="button" class="btn" style="background-color:transparent; color:white; border:1px solid var(--border-color);" onclick="closeAddEventForm()">Cancelar</button>
                    </form>
                </div>

                <!-- Catálogo de Evidencias -->
                <div>
                    <h4 style="margin: 0 0 0.5rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.25rem; display:flex; justify-content:space-between; align-items:center;">
                        <span>📂 Fotos y documentos</span>
                        <button class="btn" style="padding:0.15rem 0.5rem; font-size:0.75rem;" onclick="openAddEvidenceForm()">+ Añadir Evidencia</button>
                    </h4>
                    <div id="evidences-box" style="display:flex; flex-direction:column; gap:8px;"></div>
                </div>

                <!-- Formulario Añadir Evidencia (Escondido por defecto) -->
                <div id="add-evidence-form-box" style="display:none; background-color:var(--bg-main); padding:1rem; border-radius:6px; border:1px solid var(--border-color);">
                    <h4 style="margin-top:0;">Añadir Evidencia</h4>
                    <form onsubmit="saveEvidence(event)">
                        <div class="form-group">
                            <label>Clasificación</label>
                            <select id="ev-type" required>
                                <option value="CIVIL_RECORD">Acta Civil (CIVIL_RECORD)</option>
                                <option value="PARISH_BOOK">Libro Parroquial (PARISH_BOOK)</option>
                                <option value="PHOTO" selected>Fotografía Familiar (PHOTO)</option>
                                <option value="TESTIMONY">Testimonio Oral (TESTIMONY)</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Estatus de Confianza</label>
                            <select id="ev-confidence" required>
                                <option value="HIGH">Alta Confianza (HIGH)</option>
                                <option value="MEDIUM">Media (MEDIUM)</option>
                                <option value="LOW">Baja (LOW)</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Nombre de la Fuente de Origen</label>
                            <input type="text" id="ev-source" required placeholder="ej. Registro Civil de Ures">
                        </div>
                        <div class="form-group">
                            <label>Ruta Física del Archivo</label>
                            <input type="text" id="ev-path" placeholder="blob_store/photos/...">
                        </div>
                        <div class="form-group">
                            <label>Firma Criptográfica SHA-256 (Opcional)</label>
                            <input type="text" id="ev-hash" placeholder="Hash hexadecimal...">
                        </div>
                        <div class="form-group">
                            <label>Fuente o nota</label>
                            <input type="text" id="ev-justification" required>
                        </div>
                        <button type="submit" class="btn">Guardar Evidencia</button>
                        <button type="button" class="btn" style="background-color:transparent; color:white; border:1px solid var(--border-color);" onclick="closeAddEvidenceForm()">Cancelar</button>
                    </form>
                </div>

                <!-- Acceso de Navegación Rápida -->
                <div>
                    <h4 style="margin: 0 0 0.5rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.25rem;">Familiares</h4>
                    <div id="drawer-family-links" style="display:grid; grid-template-columns:1fr 1fr; gap:8px;"></div>
                </div>

                <!-- Panel Avanzado (Técnico / Forense) Oculto de la experiencia cotidiana -->
                <details style="margin-top: 1.5rem; border-top: 1px solid var(--border-color); padding-top: 0.75rem; font-size: 0.8rem; color: var(--text-muted);">
                    <summary style="cursor: pointer; font-weight: bold; color: var(--accent);">🛠️ Información técnica</summary>
                    <div style="margin-top: 0.5rem; display: flex; flex-direction: column; gap: 0.35rem; font-family: monospace; word-break: break-all;">
                        <div><strong>ID Único (UUID):</strong> <span id="tech-uuid">-</span></div>
                        <div><strong>Certeza Interna:</strong> <span id="tech-status">-</span></div>
                    </div>
                </details>
            </div>
        </div>
    </div>

    <script>
        // Mapeador dinámico de terminología técnica a lenguaje familiar
        const Translations = {
            'MALE': 'Masculino',
            'FEMALE': 'Femenino',
            'UNKNOWN': 'No registrado',
            'LIVING': 'Vivo',
            'DECEASED': 'Fallecido',
            'DOCUMENTED': 'Confirmado con documento',
            'FAMILY-SOURCED': 'Información familiar',
            'HYPOTHESIS': 'Por confirmar',
            'REJECTED': 'Descartado',
            'PARENT_CHILD': 'Padre/Madre',
            'SPOUSAL': 'Pareja',
            'SIBLING_LATERAL': 'Hermano/a',
            'BIRTH': 'Nacimiento',
            'BAPTISM': 'Bautismo',
            'MARRIAGE': 'Matrimonio',
            'DEATH': 'Defunción',
            'BURIAL': 'Sepelio',
            'RESIDENCE': 'Residencia',
            'MIGRATION': 'Migración',
            'CREATE': 'Creación',
            'UPDATE': 'Modificación',
            'LINK': 'Enlace',
            'UNLINK': 'Desenlace',
            'people': 'Personas',
            'relationships': 'Relaciones',
            'evidence': 'Evidencias',
            'events': 'Eventos',
            'Progenitor': 'Progenitor',
            'Cónyuge': 'Pareja',
            'Hijo/a': 'Hijo/a'
        };
        function t(key) {
            return Translations[key] || key;
        }

        let focusedId = null;
        let zoom = 1;
        let panX = 0;
        let panY = 0;
        let isDragging = false;
        let startX = 0;
        let startY = 0;
        let cachedPeople = [];

        // Control de estado de "Foto Rápida"
        let activeStep = 1;
        let originalImageSrc = '';
        let cleanImageSrc = '';
        let originalImgElement = null;
        let editRotation = 0;
        let photoMarkers = []; // Array de {x, y, personId, name}
        let tempMarkerPercent = null; // Almacena {x, y} temporal
        let webcamStream = null;

        function triggerFileInput() {
            document.getElementById('quick-file-input').click();
        }

        // Detectar pegado de imagen (Ctrl+V)
        window.addEventListener('paste', e => {
            const items = e.clipboardData.items;
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const blob = items[i].getAsFile();
                    readQuickPhotoBlob(blob);
                }
            }
        });

        function handlePhotoDrop(e) {
            e.preventDefault();
            const files = e.dataTransfer.files;
            if (files.length > 0 && files[0].type.startsWith('image/')) {
                readQuickPhotoBlob(files[0]);
            }
        }

        function handlePhotoFile(e) {
            const files = e.target.files;
            if (files.length > 0) {
                readQuickPhotoBlob(files[0]);
            }
        }

        function readQuickPhotoBlob(blob) {
            const reader = new FileReader();
            reader.onload = function(evt) {
                originalImageSrc = evt.target.result;
                cleanImageSrc = evt.target.result;
                
                // Cargar imagen en los contenedores de vista previa
                document.getElementById('preview-img-1').src = originalImageSrc;
                document.getElementById('preview-img-2').src = originalImageSrc;
                document.getElementById('preview-img-3').src = originalImageSrc;
                document.getElementById('preview-clean-img').src = originalImageSrc;
                
                document.getElementById('preview-container-1').style.display = 'flex';
                document.getElementById('quick-dropzone').style.display = 'none';
                
                // Crear elemento de imagen para filtros
                originalImgElement = new Image();
                originalImgElement.src = originalImageSrc;
                originalImgElement.onload = function() {
                    editRotation = 0;
                    applyFilters();
                };
            };
            reader.readAsDataURL(blob);
        }

        // Cámara web
        async function initWebcam() {
            try {
                webcamStream = await navigator.mediaDevices.getUserMedia({ video: true });
                const video = document.getElementById('webcam');
                video.srcObject = webcamStream;
                document.getElementById('camera-container').style.display = 'flex';
            } catch (err) {
                alert('No se pudo acceder a la cámara: ' + err.message);
            }
        }

        function captureWebcam() {
            const video = document.getElementById('webcam');
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            const ctx = canvas.getContext('2d');
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1); // Espejo correcto
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            originalImageSrc = canvas.toDataURL('image/png');
            cleanImageSrc = originalImageSrc;
            
            document.getElementById('preview-img-1').src = originalImageSrc;
            document.getElementById('preview-img-2').src = originalImageSrc;
            document.getElementById('preview-img-3').src = originalImageSrc;
            document.getElementById('preview-clean-img').src = originalImageSrc;
            
            document.getElementById('preview-container-1').style.display = 'flex';
            document.getElementById('quick-dropzone').style.display = 'none';
            document.getElementById('camera-container').style.display = 'none';
            
            if (webcamStream) {
                webcamStream.getTracks().forEach(track => track.stop());
            }
            
            originalImgElement = new Image();
            originalImgElement.src = originalImageSrc;
            originalImgElement.onload = function() {
                editRotation = 0;
                applyFilters();
            };
        }

        // Flujo del asistente
        function goToStep(step) {
            activeStep = step;
            
            // Actualizar resaltado de barra superior
            for (let i = 1; i <= 4; i++) {
                const nav = document.getElementById('step-nav-' + i);
                if (i === step) {
                    nav.style.color = 'var(--accent)';
                } else if (i < step) {
                    nav.style.color = 'var(--green)';
                } else {
                    nav.style.color = 'var(--text-muted)';
                }
            }
            
            // Alternar paneles de contenido
            for (let i = 1; i <= 4; i++) {
                document.getElementById('step-content-' + i).style.display = (i === step) ? 'flex' : 'none';
            }
            
            if (step === 4) {
                document.getElementById('preview-final-img').src = cleanImageSrc;
                document.getElementById('final-tags-count').textContent = photoMarkers.length + ' familiares marcados';
            }
        }

        // Paso 2: Marcas interactivas
        function placeMarker(e) {
            const rect = e.target.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            tempMarkerPercent = { x, y };
            
            // Desplegar modal de asignación rápido
            openQuickPersonModal();
        }

        function openQuickPersonModal() {
            document.getElementById('quick-person-modal').style.display = 'flex';
            const select = document.getElementById('qp-new-gender');
            
            // Cargar selector con familiares existentes
            select.innerHTML = '<option value="">-- Seleccionar familiar existente --</option>' +
                               '<option value="NEW_PERSON">+ Crear nuevo integrante</option>';
            cachedPeople.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.id;
                opt.textContent = p.canonical_name;
                select.appendChild(opt);
            });
        }

        function closeQuickPersonModal() {
            document.getElementById('quick-person-modal').style.display = 'none';
            tempMarkerPercent = null;
        }

        async function saveQuickPerson() {
            const selector = document.getElementById('qp-new-gender');
            const selectedVal = selector.value;
            
            if (selectedVal === 'NEW_PERSON') {
                const nameInput = document.getElementById('qp-new-name').value.trim();
                if (!nameInput) {
                    alert('Por favor introduce un nombre válido.');
                    return;
                }
                
                // Crear de forma asíncrona la persona en la base de datos
                const payload = {
                    canonical_name: nameInput,
                    gender: 'UNKNOWN',
                    research_status: 'HYPOTHESIS',
                    justification: 'Creado de forma rápida desde el catalogador de fotos'
                };
                
                const res = await fetch('/api/people', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                
                if (res.ok) {
                    const data = await res.json();
                    photoMarkers.push({
                        x: tempMarkerPercent.x,
                        y: tempMarkerPercent.y,
                        personId: data.id,
                        name: nameInput
                    });
                    loadPeople(); // Refrescar listas
                }
            } else if (selectedVal !== '') {
                const person = cachedPeople.find(p => p.id === selectedVal);
                photoMarkers.push({
                    x: tempMarkerPercent.x,
                    y: tempMarkerPercent.y,
                    personId: person.id,
                    name: person.canonical_name
                });
            }
            
            drawMarkersOnImage();
            closeQuickPersonModal();
        }

        function drawMarkersOnImage() {
            const container = document.getElementById('marker-overlay-container');
            const list = document.getElementById('tagged-list');
            container.innerHTML = '';
            list.innerHTML = '';
            
            photoMarkers.forEach((m, idx) => {
                // Crear pin visual
                const dot = document.createElement('div');
                dot.style.position = 'absolute';
                dot.style.left = m.x + '%';
                dot.style.top = m.y + '%';
                dot.style.width = '12px';
                dot.style.height = '12px';
                dot.style.borderRadius = '50%';
                dot.style.backgroundColor = 'var(--accent)';
                dot.style.border = '2px solid white';
                dot.style.transform = 'translate(-50%, -50%)';
                container.appendChild(dot);
                
                // Listar etiqueta
                const item = document.createElement('div');
                item.style.display = 'flex';
                item.style.justifyContent = 'space-between';
                item.style.fontSize = '0.85rem';
                item.innerHTML = '<span>👤 ' + m.name + '</span>' +
                                 '<span style="color:var(--red); cursor:pointer;" onclick="removeQuickTag(' + idx + ')">Eliminar</span>';
                list.appendChild(item);
            });
        }

        function removeQuickTag(index) {
            photoMarkers.splice(index, 1);
            drawMarkersOnImage();
        }

        // Paso 3: Revelado y Filtros Tradicionales en Caliente
        function rotatePhoto() {
            editRotation = (editRotation + 90) % 360;
            applyFilters();
        }

        function applyFilters() {
            if (!originalImgElement) return;
            const canvas = document.getElementById('filter-canvas');
            const ctx = canvas.getContext('2d');
            
            let w = originalImgElement.naturalWidth;
            let h = originalImgElement.naturalHeight;
            
            const angle = (editRotation * Math.PI) / 180;
            if (editRotation === 90 || editRotation === 270) {
                canvas.width = h;
                canvas.height = w;
            } else {
                canvas.width = w;
                canvas.height = h;
            }
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(angle);
            ctx.drawImage(originalImgElement, -w / 2, -h / 2);
            
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imgData.data;
            
            const brightness = parseInt(document.getElementById('slide-brightness').value);
            const contrast = parseInt(document.getElementById('slide-contrast').value) / 100;
            const grayscale = document.getElementById('check-grayscale').checked;
            const sepia = document.getElementById('check-sepia').checked;
            
            for (let i = 0; i < data.length; i += 4) {
                let r = data[i];
                let g = data[i+1];
                let b = data[i+2];
                
                // Brillo
                r += brightness;
                g += brightness;
                b += brightness;
                
                // Contraste
                r = (r - 128) * contrast + 128;
                g = (g - 128) * contrast + 128;
                b = (b - 128) * contrast + 128;
                
                // Grayscale
                if (grayscale) {
                    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
                    r = g = b = gray;
                }
                
                // Sepia
                if (sepia) {
                    const tr = 0.393 * r + 0.769 * g + 0.189 * b;
                    const tg = 0.349 * r + 0.686 * g + 0.168 * b;
                    const tb = 0.272 * r + 0.534 * g + 0.131 * b;
                    r = Math.min(255, tr);
                    g = Math.min(255, tg);
                    b = Math.min(255, tb);
                }
                
                data[i] = Math.max(0, Math.min(255, r));
                data[i+1] = Math.max(0, Math.min(255, g));
                data[i+2] = Math.max(0, Math.min(255, b));
            }
            
            ctx.putImageData(imgData, 0, 0);
            cleanImageSrc = canvas.toDataURL('image/png');
            document.getElementById('preview-clean-img').src = cleanImageSrc;
        }

        // Paso 4: Guardado de foto rápida
        async function saveQuickPhoto(event) {
            event.preventDefault();
            
            const payload = {
                original_base64: originalImageSrc,
                clean_base64: cleanImageSrc,
                tagged_people_ids: photoMarkers.map(m => m.personId),
                event_year: document.getElementById('qp-year').value,
                is_approximate: document.getElementById('qp-approximate').checked,
                note: document.getElementById('qp-note').value,
                justification: document.getElementById('qp-justification').value
            };
            
            const res = await fetch('/api/quick-photo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            if (res.ok) {
                alert('✔ Foto y evidencias guardadas con éxito en el árbol.');
                document.getElementById('placement-form').reset();
                document.getElementById('quick-dropzone').style.display = 'flex';
                document.getElementById('preview-container-1').style.display = 'none';
                photoMarkers = [];
                originalImageSrc = '';
                cleanImageSrc = '';
                goToStep(1);
                loadPeople();
                loadAuditLogs();
                runDiagnosis();
            } else {
                const err = await res.json();
                alert('✖ Fallo al guardar: ' + err.error);
            }
        }

        // Paneles de arrastre
        const viewport = document.getElementById('viewport');
        const workspace = document.getElementById('workspace');
        
        function switchTab(tabId) {
            document.querySelectorAll('.panel-section').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
            
            const section = document.getElementById(tabId);
            if (section) section.classList.add('active');
            
            const activeTab = Array.from(document.querySelectorAll('.tab')).find(t => t.textContent.includes(tabId === 'tree-tab' ? 'Lienzo' : tabId === 'register-tab' ? 'Ingesta' : 'Auditoría'));
            if (activeTab) activeTab.classList.add('active');
        }

        // Navegación con ratón (arrastre) del lienzo infinito
        function onMouseDown(e) {
            if (e.target.closest('.tree-node') || e.target.closest('.canvas-toolbar')) return;
            isDragging = true;
            startX = e.clientX - panX;
            startY = e.clientY - panY;
        }

        function onMouseMove(e) {
            if (!isDragging) return;
            panX = e.clientX - startX;
            panY = e.clientY - startY;
            updateWorkspaceTransform();
        }

        function onMouseUp() {
            isDragging = false;
        }

        function zoomIn() {
            zoom = Math.min(zoom + 0.1, 2);
            updateWorkspaceTransform();
        }

        function zoomOut() {
            zoom = Math.max(zoom - 0.1, 0.4);
            updateWorkspaceTransform();
        }

        function resetZoomAndPan() {
            zoom = 1;
            panX = 0;
            panY = 0;
            updateWorkspaceTransform();
        }

        function updateWorkspaceTransform() {
            workspace.style.transform = 'translate(' + panX + 'px, ' + panY + 'px) scale(' + zoom + ')';
            drawConnections();
        }

        function centerOnFocus() {
            const activeCard = document.querySelector('.tree-node.focus');
            if (activeCard) {
                const rect = activeCard.getBoundingClientRect();
                const vRect = viewport.getBoundingClientRect();
                panX = (vRect.width / 2) - (rect.width / 2) - activeCard.offsetLeft * zoom;
                panY = (vRect.height / 2) - (rect.height / 2) - activeCard.offsetTop * zoom;
                updateWorkspaceTransform();
            }
        }

        // Censo de integrantes rápido en sidebar
        function filterSidebarList() {
            const query = document.getElementById('sidebar-search').value.toLowerCase().trim();
            renderSidebarList(query);
        }

        function renderSidebarList(query = '') {
            const list = document.getElementById('people-list');
            list.innerHTML = '';
            
            const filtered = cachedPeople.filter(p => p.canonical_name.toLowerCase().includes(query));
            
            filtered.forEach(p => {
                const item = document.createElement('div');
                item.className = 'member-list-item';
                
                const dotColor = p.research_status === 'DOCUMENTED' ? 'var(--green)' : p.research_status === 'FAMILY-SOURCED' ? 'var(--yellow)' : 'var(--red)';
                item.innerHTML = '<span class="dot" style="background-color:' + dotColor + '"></span>' +
                                 '<span class="name">' + p.canonical_name + '</span>';
                item.onclick = () => focusTree(p.id);
                list.appendChild(item);
            });
        }

        function openDrawer() {
            document.getElementById('details-drawer').classList.add('open');
        }

        function closeDrawer() {
            document.getElementById('details-drawer').classList.remove('open');
        }

        function openAddEventForm() { document.getElementById('add-event-form-box').style.display = 'block'; }
        function closeAddEventForm() { document.getElementById('add-event-form-box').style.display = 'none'; }
        function openAddEvidenceForm() { document.getElementById('add-evidence-form-box').style.display = 'block'; }
        function closeAddEvidenceForm() { document.getElementById('add-evidence-form-box').style.display = 'none'; }

        async function loadPeople() {
            const res = await fetch('/api/people');
            const people = await res.json();
            cachedPeople = people;
            
            document.getElementById('total-count').textContent = people.length;
            renderSidebarList();
            
            const selectA = document.getElementById('rel-a');
            const selectB = document.getElementById('rel-b');
            
            selectA.innerHTML = '<option value="">-- Seleccionar Integrante A --</option>';
            selectB.innerHTML = '<option value="">-- Seleccionar Integrante B --</option>';
            
            people.forEach(p => {
                const optA = document.createElement('option');
                optA.value = p.id;
                optA.textContent = p.canonical_name;
                selectA.appendChild(optA);
                
                const optB = document.createElement('option');
                optB.value = p.id;
                optB.textContent = p.canonical_name;
                selectB.appendChild(optB);
            });
        }

        // Construir visualización del árbol focalizado
        async function focusTree(personId) {
            focusedId = personId;
            const res = await fetch('/api/tree-focus?id=' + personId);
            const data = await res.json();
            
            const container = document.getElementById('tree-visualization');
            container.innerHTML = '';
            
            // 1. Fila de Padres (Ancestros)
            const parentsRow = document.createElement('div');
            parentsRow.className = 'tree-row';
            if (data.parents.length === 0) {
                parentsRow.innerHTML = '<div style="color:var(--text-muted); font-style:italic; font-size:0.8rem;">[Ancestros Desconocidos]</div>';
            } else {
                data.parents.forEach(p => {
                    const node = document.createElement('div');
                    node.className = 'tree-node';
                    node.id = 'node-' + p.id;
                    node.innerHTML = '<div class="node-photo">👤</div><div class="node-info"><div class="node-role">Progenitor (' + p.verification_level + ')</div><div class="node-name">' + p.canonical_name + '</div></div>';
                    node.onclick = () => focusTree(p.id);
                    parentsRow.appendChild(node);
                });
            }
            
            // 2. Fila del Foco Central + Cónyuges
            const focusRow = document.createElement('div');
            focusRow.className = 'tree-row';
            
            const focusNode = document.createElement('div');
            focusNode.className = 'tree-node focus';
            focusNode.id = 'node-' + data.person.id;
            focusNode.innerHTML = '<div class="node-photo">👤</div><div class="node-info"><div class="node-role">Persona Focal</div><div class="node-name">' + data.person.canonical_name + '</div></div>';
            focusNode.onclick = () => openPersonDetails(data.person.id);
            focusRow.appendChild(focusNode);
            
            data.spouses.forEach(s => {
                const node = document.createElement('div');
                node.className = 'tree-node';
                node.id = 'node-' + s.id;
                node.innerHTML = '<div class="node-photo">👤</div><div class="node-info"><div class="node-role">Cónyuge (' + s.verification_level + ')</div><div class="node-name">' + s.canonical_name + '</div></div>';
                node.onclick = () => focusTree(s.id);
                focusRow.appendChild(node);
            });
            
            // 3. Fila de Hijos (Descendencia)
            const childrenRow = document.createElement('div');
            childrenRow.className = 'tree-row';
            if (data.children.length === 0) {
                childrenRow.innerHTML = '<div style="color:var(--text-muted); font-style:italic; font-size:0.8rem;">[Descendencia Desconocida]</div>';
            } else {
                data.children.forEach(c => {
                    const node = document.createElement('div');
                    node.className = 'tree-node';
                    node.id = 'node-' + c.id;
                    node.innerHTML = '<div class="node-photo">👤</div><div class="node-info"><div class="node-role">Descendiente (' + c.verification_level + ')</div><div class="node-name">' + c.canonical_name + '</div></div>';
                    node.onclick = () => focusTree(c.id);
                    childrenRow.appendChild(node);
                });
            }
            
            container.appendChild(parentsRow);
            container.appendChild(focusRow);
            container.appendChild(childrenRow);
            
            switchTab('tree-tab');
            setTimeout(() => {
                drawConnections(data);
                centerOnFocus();
            }, 100);
        }

        // Dibujar curvas dinámicas mediante el lienzo SVG
        function drawConnections(data) {
            const svg = document.getElementById('svg-connections');
            svg.innerHTML = '';
            if (!data) return;

            const focusNode = document.getElementById('node-' + data.person.id);
            if (!focusNode) return;
            
            const fRect = {
                x: focusNode.offsetLeft,
                y: focusNode.offsetTop,
                w: focusNode.offsetWidth,
                h: focusNode.offsetHeight
            };

            // Enlazar padres
            data.parents.forEach(p => {
                const pNode = document.getElementById('node-' + p.id);
                if (pNode) {
                    drawBezierLine(pNode.offsetLeft + pNode.offsetWidth/2, pNode.offsetTop + pNode.offsetHeight,
                                   fRect.x + fRect.w/2, fRect.y, p.verification_level);
                }
            });

            // Enlazar parejas
            data.spouses.forEach(s => {
                const sNode = document.getElementById('node-' + s.id);
                if (sNode) {
                    drawBezierLine(fRect.x + fRect.w, fRect.y + fRect.h/2,
                                   sNode.offsetLeft, sNode.offsetTop + sNode.offsetHeight/2, s.verification_level);
                }
            });

            // Enlazar hijos
            data.children.forEach(c => {
                const cNode = document.getElementById('node-' + c.id);
                if (cNode) {
                    drawBezierLine(fRect.x + fRect.w/2, fRect.y + fRect.h,
                                   cNode.offsetLeft + cNode.offsetWidth/2, cNode.offsetTop, c.verification_level);
                }
            });
        }

        function drawBezierLine(x1, y1, x2, y2, level) {
            const svg = document.getElementById('svg-connections');
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            
            // Curva de Bezier para mayor fluidez
            const controlY = (y1 + y2) / 2;
            const d = 'M ' + x1 + ' ' + y1 + ' C ' + x1 + ' ' + controlY + ', ' + x2 + ' ' + controlY + ', ' + x2 + ' ' + y2;
            
            path.setAttribute('d', d);
            path.setAttribute('fill', 'none');
            
            // Estilo según consistencia / certeza pericial
            if (level === 'DOCUMENTED') {
                path.setAttribute('stroke', '#10b981');
                path.setAttribute('stroke-width', '2.5');
            } else if (level === 'FAMILY-SOURCED') {
                path.setAttribute('stroke', '#f59e0b');
                path.setAttribute('stroke-width', '2');
                path.setAttribute('stroke-dasharray', '5,5');
            } else {
                path.setAttribute('stroke', '#a855f7');
                path.setAttribute('stroke-width', '1.5');
                path.setAttribute('stroke-dasharray', '3,3');
            }
            
            svg.appendChild(path);
        }

        // Obtener detalles completos de un integrante y desplegar ficha lateral
        async function openPersonDetails(personId) {
            const res = await fetch('/api/tree-focus?id=' + personId);
            const data = await res.json();
            
            document.getElementById('d-canonical-name').textContent = data.person.canonical_name;
            document.getElementById('d-gender-state').textContent = 'Género: ' + t(data.person.gender) + ' | Estado: ' + t(data.person.state);
            
            // Badge de certeza
            const badgeBox = document.getElementById('d-status-badge');
            badgeBox.innerHTML = '';
            const badge = document.createElement('span');
            badge.className = 'badge ' + (data.person.research_status === 'DOCUMENTED' ? 'badge-green' : data.person.research_status === 'FAMILY-SOURCED' ? 'badge-yellow' : 'badge-red');
            badge.textContent = t(data.person.research_status);
            badgeBox.appendChild(badge);

            // Cargar datos a la sección avanzada de ingeniería
            document.getElementById('tech-uuid').textContent = data.person.id;
            document.getElementById('tech-status').textContent = data.person.research_status;

            // Enlaces rápidos de parentesco
            const linksBox = document.getElementById('drawer-family-links');
            linksBox.innerHTML = '';
            
            const family = [...data.parents.map(p => ({...p, rel: 'Progenitor'})), 
                            ...data.spouses.map(s => ({...s, rel: 'Cónyuge'})), 
                            ...data.children.map(c => ({...c, rel: 'Hijo/a'}))];

            if (family.length === 0) {
                linksBox.innerHTML = '<div style="grid-column: span 2; color:var(--text-muted); font-size:0.8rem; font-style:italic;">No hay parentescos registrados para navegación rápida.</div>';
            } else {
                family.forEach(f => {
                    const btn = document.createElement('button');
                    btn.className = 'btn';
                    btn.style.backgroundColor = 'var(--bg-main)';
                    btn.style.border = '1px solid var(--border-color)';
                    btn.style.color = 'white';
                    btn.style.fontSize = '0.75rem';
                    btn.style.padding = '0.4rem';
                    btn.style.textAlign = 'left';
                    btn.innerHTML = '<div style="color:var(--accent); font-weight:bold;">' + t(f.rel) + '</div>' + f.canonical_name;
                    btn.onclick = () => {
                        focusTree(f.id);
                        openPersonDetails(f.id);
                    };
                    linksBox.appendChild(btn);
                });
            }

            // Cargar timeline e imágenes asociadas de forma asíncrona
            loadTimeline(personId);
            loadEvidences(personId);

            openDrawer();
        }

        async function loadTimeline(personId) {
            const res = await fetch('/api/timeline?person_id=' + personId);
            const events = await res.json();
            const box = document.getElementById('timeline-box');
            box.innerHTML = '';
            
            if (events.length === 0) {
                box.innerHTML = '<div style="color:var(--text-muted); font-size:0.8rem; font-style:italic;">No hay acontecimientos registrados para la línea temporal.</div>';
            } else {
                events.forEach(e => {
                    const ev = document.createElement('div');
                    ev.className = 'timeline-event';
                    ev.innerHTML = '<div class="timeline-year">' + e.event_year + '</div>' +
                                   '<div class="timeline-desc">' + t(e.type) + ' ' + (e.is_approximate ? '(Aproximado)' : '') + '</div>';
                    box.appendChild(ev);
                });
            }
        }

        async function loadEvidences(personId) {
            const res = await fetch('/api/evidence?person_id=' + personId);
            const evidence = await res.json();
            const box = document.getElementById('evidences-box');
            const photoViewer = document.getElementById('d-photo');
            
            box.innerHTML = '';
            photoViewer.innerHTML = '👤'; // Placeholder por defecto
            
            if (evidence.length === 0) {
                box.innerHTML = '<div style="color:var(--text-muted); font-size:0.8rem; font-style:italic;">No hay actas ni fotografías asociadas.</div>';
            } else {
                evidence.forEach(e => {
                    const div = document.createElement('div');
                    div.style.padding = '0.5rem';
                    div.style.backgroundColor = 'var(--bg-main)';
                    div.style.border = '1px solid var(--border-color)';
                    div.style.borderRadius = '4px';
                    div.style.fontSize = '0.8rem';
                    div.innerHTML = '<div style="font-weight:bold; color:var(--accent);">' + t(e.type) + '</div>' +
                                    '<div>Fuente: ' + e.source_name + '</div>' +
                                    (e.file_path ? '<div style="font-family:monospace; font-size:0.75rem; margin-top:0.25rem;">' + e.file_path + '</div>' : '');
                    box.appendChild(div);

                    // Si la evidencia es una foto familiar, la cargamos como dominante
                    if (e.type === 'PHOTO' && e.file_path) {
                        photoViewer.innerHTML = '<img src="' + e.file_path + '" alt="Foto familiar" onerror="this.outerHTML=\\'👤\\'">';
                    }
                });
            }
        }

        async function saveEvent(event) {
            event.preventDefault();
            const payload = {
                person_id: focusedId,
                type: document.getElementById('e-type').value,
                event_year: document.getElementById('e-year').value,
                event_month: document.getElementById('e-month').value,
                event_day: document.getElementById('e-day').value,
                is_approximate: false,
                justification: document.getElementById('e-justification').value
            };
            
            const res = await fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            if (res.ok) {
                alert('✔ Acontecimiento histórico guardado de forma segura.');
                closeAddEventForm();
                loadTimeline(focusedId);
                loadAuditLogs();
            } else {
                const err = await res.json();
                alert('✖ Fallo al guardar: ' + err.error);
            }
        }

        async function saveEvidence(event) {
            event.preventDefault();
            const payload = {
                person_id: focusedId,
                type: document.getElementById('ev-type').value,
                confidence_rating: document.getElementById('ev-confidence').value,
                source_name: document.getElementById('ev-source').value,
                file_path: document.getElementById('ev-path').value,
                file_hash: document.getElementById('ev-hash').value,
                justification: document.getElementById('ev-justification').value
            };
            
            const res = await fetch('/api/evidence', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            if (res.ok) {
                alert('✔ Evidencia guardada de forma segura.');
                closeAddEvidenceForm();
                loadEvidences(focusedId);
                loadAuditLogs();
            } else {
                const err = await res.json();
                alert('✖ Fallo al guardar: ' + err.error);
            }
        }

        async function registerPerson(event) {
            event.preventDefault();
            const payload = {
                canonical_name: document.getElementById('p-name').value,
                gender: document.getElementById('p-gender').value,
                research_status: document.getElementById('p-status').value,
                justification: document.getElementById('p-justification').value
            };
            
            const res = await fetch('/api/people', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            if (res.ok) {
                alert('✔ Integrante registrado exitosamente en la cadena de firmas.');
                document.getElementById('person-form').reset();
                loadPeople();
                loadAuditLogs();
                runDiagnosis();
            } else {
                const err = await res.json();
                alert('✖ Fallo al registrar: ' + err.error);
            }
        }

        async function linkRelationship(event) {
            event.preventDefault();
            const payload = {
                person_a_id: document.getElementById('rel-a').value,
                person_b_id: document.getElementById('rel-b').value,
                type: document.getElementById('rel-type').value,
                verification_level: document.getElementById('rel-status').value,
                justification: document.getElementById('rel-justification').value
            };
            
            const res = await fetch('/api/relationships', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            if (res.ok) {
                alert('✔ Parentesco enlazado de forma atómica en el disco.');
                document.getElementById('relation-form').reset();
                loadPeople();
                loadAuditLogs();
                runDiagnosis();
            } else {
                const err = await res.json();
                alert('✖ Fallo al enlazar: ' + err.error);
            }
        }

        async function loadAuditLogs() {
            const res = await fetch('/api/audit');
            const logs = await res.json();
            const tbody = document.getElementById('audit-rows');
            tbody.innerHTML = '';
            
            logs.forEach(l => {
                const tr = document.createElement('tr');
                tr.style.borderBottom = '1px solid var(--border-color)';
                tr.innerHTML = '<td style="padding:0.5rem; color:var(--text-muted);">' + l.id.substring(0,8) + '...</td>' +
                               '<td style="padding:0.5rem; font-weight:bold;">' + t(l.action_type) + '</td>' +
                               '<td style="padding:0.5rem;">' + t(l.entity_name) + '</td>' +
                               '<td style="padding:0.5rem;">' + l.justification + '</td>' +
                               '<td style="padding:0.5rem; color:var(--green); font-family:monospace;">' + l.record_hash.substring(0,16) + '...</td>';
                tbody.appendChild(tr);
            });
        }

        async function runDiagnosis() {
            const res = await fetch('/api/diagnose');
            const d = await res.json();
            const status = document.getElementById('diagnostic-status');
            
            if (d.integrity === 'ok' && d.foreignKeys === 'ok' && d.cryptographicAudit === 'intact') {
                status.textContent = '✓ Todo está en orden';
                status.className = 'badge badge-green';
            } else {
                status.textContent = '⚠ Atención requerida';
                status.className = 'badge badge-red';
            }
        }

        // Inicialización
        window.addEventListener('resize', drawConnections);
        loadPeople();
        loadAuditLogs();
        runDiagnosis();
    </script>
</body>
</html>`;
}
