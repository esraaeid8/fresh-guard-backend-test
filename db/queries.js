const db = require("../database/db");

function mapInspections(rows) {
  return rows.map((row) => ({
    ...row,
    needs_review: Boolean(row.needs_review),
  }));
}

function pageInspections(condition, { from, to, productType, defectType, limit = 20, offset = 0 }) {
  const where = `
    WHERE ${condition}
      AND (? IS NULL OR created_at >= ?)
      AND (? IS NULL OR created_at <= ?)
      AND (? IS NULL OR product = ?)
      AND (? IS NULL OR status = ?)`;

  const params = [
    from || null,
    from || null,
    to || null,
    to || null,
    productType || null,
    productType || null,
    defectType || null,
    defectType || null,
  ];

  const total = db
    .prepare(`SELECT COUNT(*) AS total FROM inspections ${where}`)
    .get(...params).total;

  const rows = mapInspections(
    db
      .prepare(
        `
      SELECT * FROM inspections ${where}
      ORDER BY created_at DESC, id DESC
      LIMIT ? OFFSET ?
    `
      )
      .all(...params, limit, offset)
  );

  return { rows, total };
}

function getInspectionsPage(filters = {}) {
  return pageInspections("1 = 1", filters);
}

function getDefectsPage(filters = {}) {
  return pageInspections("status = 'defective'", filters);
}

function getNeedsReviewPage(filters = {}) {
  return pageInspections("needs_review = 1", filters);
}

function getAlertsPage({ since, limit = 20, offset = 0 } = {}) {
  const where = `
    WHERE (? IS NULL OR julianday(created_at) > julianday(?))`;

  const params = [since || null, since || null];

  const total = db
    .prepare(`SELECT COUNT(*) AS total FROM alerts ${where}`)
    .get(...params).total;

  const rows = db
    .prepare(
      `
    SELECT * FROM alerts ${where}
    ORDER BY created_at DESC, id DESC
    LIMIT ? OFFSET ?
  `
    )
    .all(...params, limit, offset);

  return { rows, total };
}

module.exports = {
  getInspectionsPage,
  getDefectsPage,
  getNeedsReviewPage,
  getAlertsPage,
};