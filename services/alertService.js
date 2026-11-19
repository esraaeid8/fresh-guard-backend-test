
const db = require("../database/db");

function readFraction(name, defaultValue) {
    const rawValue = process.env[name];
    const value = rawValue === undefined || rawValue.trim() === ""
        ? defaultValue
        : Number(rawValue);

    if (!Number.isFinite(value) || value < 0 || value > 1) {
        throw new Error(`${name} must be a number between 0 and 1`);
    }

    return value;
}

function readMinimumInspections() {
    const rawValue = process.env.MIN_INSPECTIONS_FOR_DEFECT_RATE;
    const value = rawValue === undefined || rawValue.trim() === ""
        ? 50
        : Number(rawValue);

    if (!Number.isInteger(value) || value < 1) {
        throw new Error("MIN_INSPECTIONS_FOR_DEFECT_RATE must be a positive integer");
    }

    return value;
}

function hasRecentDefectRateAlert(batchId, lineId) {
    const query = batchId === undefined || batchId === null
        ? db.prepare(`
            SELECT 1
            FROM alerts a
            JOIN inspections i ON i.id = a.inspection_id
            WHERE i.batch_id IS NULL
              AND i.line_id IS ?
              AND a.message LIKE '%Defective rate exceeded threshold%'
              AND a.created_at >= datetime('now', '-10 minutes')
            LIMIT 1
        `)
        : db.prepare(`
            SELECT 1
            FROM alerts a
            JOIN inspections i ON i.id = a.inspection_id
            WHERE i.batch_id = ?
              AND i.line_id IS ?
              AND a.message LIKE '%Defective rate exceeded threshold%'
              AND a.created_at >= datetime('now', '-10 minutes')
            LIMIT 1
        `);

    return batchId === undefined || batchId === null
        ? Boolean(query.get(lineId ?? null))
        : Boolean(query.get(batchId, lineId ?? null));
}

function checkAlert(inspection, inspectionId, batchId, lineId) {
    const confidenceThreshold = readFraction("ALERT_THRESHOLD", 0.8);
    const defectRateThreshold = readFraction("DEFECT_RATE_THRESHOLD", 0.2);
    const minimumInspections = readMinimumInspections();

    const query = batchId === undefined || batchId === null
        ? db.prepare(`
            SELECT COUNT(*) AS total,
                   SUM(CASE WHEN status = 'defective' THEN 1 ELSE 0 END) AS defective
            FROM inspections
            WHERE batch_id IS NULL AND line_id IS ?
        `)
        : db.prepare(`
            SELECT COUNT(*) AS total,
                   SUM(CASE WHEN status = 'defective' THEN 1 ELSE 0 END) AS defective
            FROM inspections
            WHERE batch_id = ? AND line_id IS ?
        `);
    const stats = batchId === undefined || batchId === null
        ? query.get(lineId ?? null)
        : query.get(batchId, lineId ?? null);

    const currentCount = stats.total;
    const currentDefectiveCount = stats.defective || 0;
    const previousCount = currentCount - 1;
    const previousDefectiveCount =
        currentDefectiveCount - (inspection.status === "defective" ? 1 : 0);
    const currentDefectRate = currentCount > 0
        ? currentDefectiveCount / currentCount
        : 0;
    const previousDefectRate = previousCount > 0
        ? previousDefectiveCount / previousCount
        : 0;
    const defectRateAlertCandidate =
        currentCount >= minimumInspections &&
        currentDefectRate > defectRateThreshold &&
        (
            previousCount < minimumInspections ||
            previousDefectRate <= defectRateThreshold
        );
    const defectRateAlert =
        defectRateAlertCandidate &&
        !hasRecentDefectRateAlert(batchId, lineId);

    const messages = [];
    if (
        inspection.needs_review === true ||
        inspection.confidence < confidenceThreshold
    ) {
        messages.push("Inspection needs review");
    }

    if (defectRateAlert) {
        messages.push(
            `Defective rate exceeded threshold (${(currentDefectRate * 100).toFixed(1)}%)`
        );
    }

    if (messages.length === 0) {
        return {
            alert: false,
            message: "No alert needed"
        };
    }

    const result = db.prepare(`
        INSERT OR IGNORE INTO alerts (inspection_id, message)
        VALUES (?, ?)
    `).run(inspectionId, messages.join("; "));

    return {
        alert: result.changes > 0,
        message: result.changes > 0
            ? messages.join("; ")
            : "Alert already exists"
    };
}

module.exports = { checkAlert };
