const { AppError, dateText, optionalText, positiveInteger } = require("../middleware/validate");

function readPage(req) {
  const limit = positiveInteger(req.query.limit, "limit", true) ?? 20;
  const offset = req.query.offset !== undefined ? positiveInteger(req.query.offset, "offset", true) ?? 0 : 0;
  return { limit, offset };
}

function readFilters(req) {
  const from = dateText(req.query.from, "from", true);
  const to = dateText(req.query.to, "to", true);
  const productType = optionalText(req.query.product_type, "product_type");
  const lineId = positiveInteger(req.query.line_id, "line_id", true);
  return { from, to, productType, lineId };
}

function withImageUrl(req, row) {
  if (!row) return row;
  if (!row.image_url) return { ...row, image_url: null };
  if (row.image_url.startsWith("http://") || row.image_url.startsWith("https://")) {
    return row;
  }
  const cleanPath = row.image_url.replace(/^\/+/, "");
  return {
    ...row,
    image_url: `${req.protocol}://${req.get("host")}/${cleanPath}`,
  };
}

function listResponse(items, total, limit, offset) {
  return {
    items,
    total,
    limit,
    offset,
  };
}

module.exports = {
  readPage,
  readFilters,
  withImageUrl,
  listResponse,
};