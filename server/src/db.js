const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

let memoryServer;

// Uses MONGO_URI when provided (local MongoDB or Atlas). Otherwise starts an embedded
// MongoDB that persists to server/.data so the project runs with zero setup.
async function connectDB({ inMemoryOnly = false } = {}) {
  let uri = process.env.MONGO_URI;
  if (!uri) {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const opts = {};
    if (!inMemoryOnly) {
      const dbPath = path.join(__dirname, '..', '.data');
      fs.mkdirSync(dbPath, { recursive: true });
      opts.instance = { dbPath, storageEngine: 'wiredTiger', port: Number(process.env.MONGO_PORT) || 27027 };
    }
    memoryServer = await MongoMemoryServer.create(opts);
    uri = memoryServer.getUri();
    console.log(inMemoryOnly ? '🧪 In-memory MongoDB started' : `🗄️  Embedded MongoDB running at ${uri} (data in server/.data)`);
  }
  await mongoose.connect(uri, { dbName: process.env.MONGO_DB || 'siksha' });
  return uri;
}

async function disconnectDB() {
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
}

module.exports = { connectDB, disconnectDB };
