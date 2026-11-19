const queries = require('../db/queries');
const {
  AppError, dateText, optionalText, positiveId
} = require('../middleware/validate');
const {
  readPage, readFilters, withImageUrl, listResponse
} = require('../utils/mobile');

function readUnread(req) {
  const { unread } = req.query;
  if (unread !== undefined && !['true', 'false'].includes(unread)) {
    throw new AppError(400, 'unread must be true or false');
  }
  return unread === 'true';
}

// GET /api/quality/defects?from&to&product_type&line_id&defect_type&limit&offset
function listDefects(req, res) {
  const filters = readFilters(req);
  const defectType = optionalText(req.query.defect_type, 'defect_type');
  const { limit, offset } = readPage(req);
  const { rows, total } = queries.getDefectsPage({
    ...filters, defectType, limit, offset
  });
  res.json(listResponse(rows.map((row) => withImageUrl(req, row)), total, limit, offset));
}

// GET /api/quality/needs-review?from&to&product_type&line_id&limit&offset
function listNeedsReview(req, res) {
  const filters = readFilters(req);
  const { limit, offset } = readPage(req);
  const { rows, total } = queries.getNeedsReviewPage({ ...filters, limit, offset });
  res.json(listResponse(rows.map((row) => withImageUrl(req, row)), total, limit, offset));
}

// GET /api/quality/alerts?unread=true&since=<time>&limit&offset
function listAlerts(req, res) {
  const since = dateText(req.query.since, 'since', true);
  const { limit, offset } = readPage(req);
  const { rows, total } = queries.getAlertsPage({
    unread: readUnread(req), since, limit, offset
  });
  res.json(listResponse(rows, total, limit, offset));
}

// GET /api/quality/alerts/new?since=<time>   (الموبايل بيسحبها كل كام ثانية)
// بيرجّع server_time: الموبايل يبعته في الطلب الجاي كـ since.
function newAlerts(req, res) {
  const since = dateText(req.query.since, 'since'); // مطلوب
  const { limit, offset } = readPage(req);
  const serverTime = new Date().toISOString(); // قبل الاستعلام عشان ما يضيعش تنبيه
  const { rows, total } = queries.getAlertsPage({
    unread: false, since, limit, offset
  });
  res.json({ ...listResponse(rows, total, limit, offset), server_time: serverTime });
}

// PATCH /api/quality/alerts/:id/read
function readAlert(req, res) {
  const id = positiveId(req.params.id, 'id');
  if (!queries.markAlertRead(id)) throw new AppError(404, 'Alert not found');
  res.json({ id, is_read: true });
}

// GET /api/quality/stats/defects-by-type?from&to
function defectsByType(req, res) {
  const from = dateText(req.query.from, 'from', true);
  const to = dateText(req.query.to, 'to', true);
  res.json({ defects_by_type: queries.getDefectsByType({ from, to }) });
}

// GET /api/quality/inspections/:id
function getInspection(req, res) {
  const id = positiveId(req.params.id, 'id');
  const inspection = queries.getInspection(id);
  if (!inspection) throw new AppError(404, 'Inspection not found');
  res.json({ inspection: withImageUrl(req, inspection) });
}

module.exports = {
  listDefects, listAlerts, newAlerts, listNeedsReview,
  readAlert, defectsByType, getInspection
};
