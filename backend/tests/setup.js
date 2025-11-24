const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

// Setup: Before all tests
beforeAll(async () => {
  // Disconnect if already connected (from previous test runs)
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  
  // Create an in-memory MongoDB instance
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Connect to the in-memory database with increased timeout settings
  await mongoose.connect(mongoUri, {
    dbName: 'test-db',
    serverSelectionTimeoutMS: 30000, // 30 seconds
    socketTimeoutMS: 45000 // 45 seconds
  });
  
  // Ensure connection is ready (connected state is 1)
  if (mongoose.connection.readyState !== 1) {
    await new Promise((resolve, reject) => {
      mongoose.connection.once('connected', resolve);
      mongoose.connection.once('error', reject);
      // Timeout after 30 seconds
      setTimeout(() => reject(new Error('Connection timeout')), 30000);
    });
  }
  
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
    try {
      await collections[key].deleteMany({});
    } catch (error) {
      // Ignore errors during cleanup (collection might not exist or connection issues)
    }
  }
});

