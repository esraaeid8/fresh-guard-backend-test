const queries = require('../db/queries');
const { AppError, dateText, positiveInteger } = require('../middleware/validate');
const {
  readPage, readFilters, withImageUrl, listResponse
} = require('../utils/mobile');

// GET /api/supervisor/inspections?from&to&product_type&line_id&limit&offset
function listInspections(req, res) {
  const filters = readFilters(req);
  const { limit, offset } = readPage(req);
  const { rows, total } = queries.getInspectionsPage({ ...filters, limit, offset });
  res.json(listResponse(rows.map((row) => withImageUrl(req, row)), total, limit, offset));
}

// GET /api/supervisor/current-batch?line_id
function currentBatch(req, res) {
  const lineId = positiveInteger(req.query.line_id, 'line_id', true);
  const batch = queries.getOpenBatch(lineId);
  if (!batch) {
    return res.json({ batch: null, total: 0, good: 0, defective: 0, defect_rate: 0 });
  }
  const stats = queries.getBatchInspectionStats(batch.id);
  const total = stats.total || 0;
  const defective = stats.defective || 0;
  res.json({
    batch,
    total,
    good: stats.good || 0,
    defective,
    defect_rate: total ? defective / total : 0
  });
}

// GET /api/supervisor/alerts?unread=true&since=<time>&limit&offset
function listAlerts(req, res) {
  const { unread } = req.query;
  if (unread !== undefined && !['true', 'false'].includes(unread)) {
    throw new AppError(400, 'unread must be true or false');
  }
  const since = dateText(req.query.since, 'since', true);
  const { limit, offset } = readPage(req);
  const { rows, total } = queries.getAlertsPage({
    unread: unread === 'true', since, limit, offset
  });
  res.json(listResponse(rows, total, limit, offset));
}

module.exports = { listInspections, currentBatch, listAlerts };
