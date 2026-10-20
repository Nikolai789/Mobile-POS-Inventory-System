const { createApp } = require('./app');
const { initializeDatabase } = require('./database');

const app = createApp();

async function startServer(port = Number(process.env.PORT || 5000)) {
  await initializeDatabase();
  return app.listen(port, '0.0.0.0', () => {
    console.log(`POS API listening on http://0.0.0.0:${port}`);
  });
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error('Unable to initialize database', error);
    process.exitCode = 1;
  });
}

module.exports = app;
module.exports.startServer = startServer;
