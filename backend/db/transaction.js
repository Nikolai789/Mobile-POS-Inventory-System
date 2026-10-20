/**
 * Run a synchronous sql.js transaction. Persistence remains an explicit post-commit step.
 * @template T
 * @param {import('sql.js').Database} database
 * @param {() => T} operation
 * @returns {T}
 */
function inTransaction(database, operation) {
  database.run('BEGIN TRANSACTION');
  try {
    const result = operation();
    database.run('COMMIT');
    return result;
  } catch (error) {
    database.run('ROLLBACK');
    throw error;
  }
}

module.exports = { inTransaction };
