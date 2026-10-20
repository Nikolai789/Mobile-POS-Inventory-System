const fs = require('node:fs');
const path = require('node:path');
const initSqlJs = require('sql.js');
const { initializeSchema } = require('./db/schema');
const { rowsFromResult } = require('./db/rows');

const databasePath = process.env.DATABASE_PATH || path.join(__dirname, 'pos.sqlite');
/** @type {import('sql.js').Database | undefined} */
let database;

function getDatabase() {
  if (!database) throw new Error('Database has not been initialized');
  return database;
}

function persistDatabase() {
  const data = getDatabase().export();
  fs.writeFileSync(databasePath, Buffer.from(data));
}

async function initializeDatabase() {
  const SQL = await initSqlJs({ locateFile: (file) => path.join(__dirname, 'node_modules', 'sql.js', 'dist', file) });
  database = fs.existsSync(databasePath)
    ? new SQL.Database(fs.readFileSync(databasePath))
    : new SQL.Database();
  initializeSchema(database);
  persistDatabase();
  return database;
}

module.exports = { getDatabase, initializeDatabase, persistDatabase, rowsFromResult };
