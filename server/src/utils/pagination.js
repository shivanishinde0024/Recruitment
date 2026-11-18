/**
 * Safe pagination parser and metadata builder.
 * Enforces maxLimit (100) per Ruling 3.14 to prevent denial of service.
 */
function parsePagination(query, defaultLimit = 10, maxLimit = 100) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const rawLimit = parseInt(query.limit, 10) || defaultLimit;
  const limit = Math.min(Math.max(1, rawLimit), maxLimit);
  const skip = (page - 1) * limit;

  return {
    page,
    limit,
    skip,
    take: limit
  };
}

function buildMeta(page, limit, total) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1
  };
}

module.exports = {
  parsePagination,
  buildMeta
};
