# Backend API Tests

This directory contains integration tests for the backend API endpoints.

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode (auto-rerun on file changes)
```bash
npm run test:watch
```

### Run tests with coverage report
```bash
npm run test:coverage
```

## Test Structure

- `setup.js` - Global test setup/teardown using in-memory MongoDB
- `api/` - API endpoint integration tests
  - `users.test.js` - User authentication and profile tests
  - `events.test.js` - Event CRUD and browsing tests

## Test Environment

- Uses **MongoDB Memory Server** for isolated, fast database testing
- Tests run in `NODE_ENV=test` mode
- Database is automatically cleaned between tests
- No external dependencies required

## Adding New Tests

1. Create a new test file in `backend/tests/api/`
2. Follow the existing test patterns:
   ```javascript
   const request = require('supertest');
   const app = require('../../app');
   
   describe('Your API Endpoint', () => {
     it('should test something', async () => {
       const response = await request(app)
         .get('/api/your-endpoint')
         .expect(200);
       
       expect(response.body).toHaveProperty('expectedField');
     });
   });
   ```

## CI Integration

Tests automatically run on every commit via GitHub Actions in `.github/workflows/ci.yml`

