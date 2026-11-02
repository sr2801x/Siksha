require('dotenv').config();
const app = require('./app');
const { connectDB, disconnectDB } = require('./db');
const { seedIfEmpty } = require('./seed');

// In dev the Vite proxy expects the API on API_PORT (default 5050); hosts set PORT in production.
const isDev = process.argv.includes('--dev');
const PORT = Number(isDev ? process.env.API_PORT : process.env.PORT) || 5050;

(async () => {
  await connectDB();
  await seedIfEmpty();
  const server = app.listen(PORT, () => console.log(`🚀 Siksha API listening on http://localhost:${PORT}`));
  const shutdown = async () => {
    server.close();
    await disconnectDB();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
})().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
