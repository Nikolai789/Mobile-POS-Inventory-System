/**
 * The sole conversion boundary between SQLite values and typed query projections.
 * The caller's row type must match its SELECT columns.
 * @template {object} [T=Record<string, import('sql.js').SqlValue>]
 * @param {import('sql.js').QueryExecResult[]} result
 * @returns {T[]}
 */
function rowsFromResult(result) {
  if (!result.length) return [];
  return result[0].values.map((values) => /** @type {T} */ (
    Object.fromEntries(values.map((value, index) => [result[0].columns[index], value]))
  ));
}

module.exports = { rowsFromResult };
