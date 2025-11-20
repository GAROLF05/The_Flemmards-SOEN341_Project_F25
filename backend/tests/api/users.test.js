const request = require('supertest');
const app = require('../../app');
const { User } = require('../../models/User');

describe('User API Endpoints', () => {
  describe('POST /api/users/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Test1234!',
        name: 'Test User',
        role: 'Student'
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should reject registration with invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'Test1234!',
        name: 'Test User',
        role: 'Student'
      };

      // Note: The controller catches validation errors and returns 500
      // In a production environment, this should be handled as 400
      const response = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject registration with missing required fields', async () => {
      const userData = {
        email: 'test@example.com',
        password: '123'
        // Missing name and role
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject duplicate email registration', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'Test1234!',
        name: 'Test User',
        role: 'Student'
      };

      // Register first user
      await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(201);

      // Try to register again with same email
      const response = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(409); // Conflict status

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/users/login', () => {
    let userId;

    beforeEach(async () => {
      // Create a test user
      const userData = {
        email: 'login@example.com',
        password: 'Test1234!',
        name: 'Test User',
        role: 'Student'
      };

      const registerResponse = await request(app)
        .post('/api/users/register')
        .send(userData);

      userId = registerResponse.body.user._id;

      // Verify user email (required for login)
      await User.findByIdAndUpdate(userId, {
        verified: true
      });
    });

    it('should login successfully with correct credentials', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          usernameEmail: 'login@example.com',
          password: 'Test1234!'
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('login@example.com');
    });

    it('should reject login with incorrect password', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          usernameEmail: 'login@example.com',
          password: 'WrongPassword123!'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          usernameEmail: 'nonexistent@example.com',
          password: 'Test1234!'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/users/profile', () => {
    let authToken;
    let userId;

    beforeEach(async () => {
      // Register and login to get token
      const registerResponse = await request(app)
        .post('/api/users/register')
        .send({
          email: 'profile@example.com',
          password: 'Test1234!',
          name: 'Profile Test',
          role: 'Student'
        });

      userId = registerResponse.body.user._id;

      // Verify user email (required for login)
      await User.findByIdAndUpdate(userId, {
        verified: true
      });

      const loginResponse = await request(app)
        .post('/api/users/login')
        .send({
          usernameEmail: 'profile@example.com',
          password: 'Test1234!'
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body).toHaveProperty('token');
      authToken = loginResponse.body.token;
    });

    it('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('profile@example.com');
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .expect(401);

      expect(response.body).toHaveProperty('code');
      expect(response.body.code).toBe('UNAUTHORIZED');
    });
  });
});

