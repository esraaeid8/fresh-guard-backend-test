function parsePagination(query) {
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 100);
  const offset = Math.max(parseInt(query.offset, 10) || 0, 0);
  return { limit, offset };
}

function buildImageUrl(req, imagePath) {
  if (!imagePath) return null;
  if (/^https?:\/\//i.test(imagePath)) return imagePath;
  const normalized = String(imagePath).replace(/^\/+/, "");
  const cleanPath = normalized.startsWith("uploads/")
    ? normalized
    : `uploads/${normalized}`;
  return `${req.protocol}://${req.get("host")}/${cleanPath}`;
}

function getInspections(req, res) {
  const { limit, offset } = parsePagination(req.query);
  const { from, to, product_type, line_id } = req.query;

  const items = [];
  const formatted = items.map((item) => ({
    ...item,
    image_url: buildImageUrl(req, item.image_path || item.image_url),
  }));

  res.json({
    data: formatted.slice(offset, offset + limit),
    total: formatted.length,
    filters: {
      from: from || null,
      to: to || null,
      product_type: product_type || null,
      line_id: line_id || null,
    },
    limit,
    offset,
  });
}

function getCurrentBatch(req, res) {
  const { line_id } = req.query;

  res.json({
    data: null,
    total: 0,
    batch: null,
    line_id: line_id || null,
    good: 0,
    defective: 0,
    defect_rate: 0,
  });
}

function getAlerts(req, res) {
  const { limit, offset } = parsePagination(req.query);
  const { unread, since } = req.query;

  const items = [];

  res.json({
    data: items.slice(offset, offset + limit),
    total: items.length,
    unread: unread !== undefined ? unread === "true" : null,
    since: since || null,
    limit,
    offset,
  });
}

module.exports = {
  getInspections,
  getCurrentBatch,
  getAlerts,
};