const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

// Setup: Before all tests
beforeAll(async () => {
  // Create an in-memory MongoDB instance
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Connect to the in-memory database
  await mongoose.connect(mongoUri, {
    dbName: 'test-db'
  });
  
  // Set NODE_ENV to test
  process.env.NODE_ENV = 'test';
  
  // Mock JWT secret if not set
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
  }
});

// Cleanup: After all tests
afterAll(async () => {
  // Close database connection
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  
  // Stop the in-memory MongoDB instance
  if (mongoServer) {
    await mongoServer.stop();
  }
});

// Cleanup: After each test - clear all collections
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

