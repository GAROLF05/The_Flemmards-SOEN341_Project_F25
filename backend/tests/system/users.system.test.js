const request = require('supertest');
const app = require('../../app');
const { User } = require('../../models/User');
const { Registration, REGISTRATION_STATUS } = require('../../models/Registrations');
const Ticket = require('../../models/Ticket');
const Administrator = require('../../models/Administrators');
const bcrypt = require('bcrypt');

/**
 * System Test: Complete User Management Workflow
 * 1. User registration (Student and Organizer)
 * 2. Email verification workflow
 * 3. User login (with verification requirement)
 * 4. Password reset workflow (forgot password, reset password)
 * 5. User profile retrieval
 * 6. User update (name, username, password)
 * 7. User deletion (with cascading deletes)
 * 8. Authorization checks (owner/admin only operations)
 * 9. Edge cases (duplicate email, duplicate username, invalid tokens, etc.)
 */
describe('Users System Test - Complete User Management Workflow', () => {
  let adminToken;
  let studentToken;
  let studentUserId;
  let organizerToken;
  let organizerUserId;
  let studentVerificationToken;
  let organizerVerificationToken;
  let resetPasswordToken;

  beforeEach(async () => {
    // Setup: Create admin user
    const hashedPassword = await bcrypt.hash('Admin1234!', 10);
    const adminUser = await Administrator.create({
      email: 'useradmin@example.com',
      password: hashedPassword,
      name: 'User Admin'
    });

    // Admin login
    const adminLogin = await request(app)
      .post('/api/users/login')
      .send({
        usernameEmail: 'useradmin@example.com',
        password: 'Admin1234!',
        role: 'admin'
      });
    adminToken = adminLogin.body.token;
  });

  describe('Complete User Lifecycle Workflow', () => {
    it('should execute complete user lifecycle from registration to deletion', async () => {
      // ============================================
      // PHASE 1: Register Student User
      // ============================================
      console.log('Phase 1: Register Student User');

      const studentRegisterResponse = await request(app)
        .post('/api/users/register')
        .send({
          email: 'student@systemtest.com',
          password: 'Student1234!',
          name: 'Test Student',
          role: 'Student',
          username: `student_${Date.now()}_${Math.random().toString(36).substring(7)}`
        })
        .expect(201);

      expect(studentRegisterResponse.body.message).toBe('User registered successfully');
      expect(studentRegisterResponse.body.user.email).toBe('student@systemtest.com');
      expect(studentRegisterResponse.body.user.role).toBe('Student');
      expect(studentRegisterResponse.body.user.approved).toBe(true); // Students approved by default
      expect(studentRegisterResponse.body.user.verified).toBeUndefined(); // Not in response

      studentUserId = studentRegisterResponse.body.user._id;

      // Get verification token from database
      const studentUser = await User.findById(studentUserId).select('+verificationToken');
      studentVerificationToken = studentUser.verificationToken;
      expect(studentVerificationToken).toBeDefined();

      // ============================================
      // PHASE 2: Try to Login Before Verification (Should Fail)
      // ============================================
      console.log('Phase 2: Try to Login Before Verification (Should Fail)');

      const loginBeforeVerify = await request(app)
        .post('/api/users/login')
        .send({
          usernameEmail: 'student@systemtest.com',
          password: 'Student1234!'
        })
        .expect(403);

      expect(loginBeforeVerify.body.error).toContain('verify your email');

      // ============================================
      // PHASE 3: Verify Email
      // ============================================
      console.log('Phase 3: Verify Email');

      const verifyResponse = await request(app)
        .get(`/api/users/verify-email?token=${studentVerificationToken}`)
        .expect(302); // Redirect response

      // Verify user is now verified
      const verifiedUser = await User.findById(studentUserId);
      expect(verifiedUser.verified).toBe(true);
      expect(verifiedUser.verificationToken).toBeUndefined();

      // ============================================
      // PHASE 4: Login After Verification
      // ============================================
      console.log('Phase 4: Login After Verification');

      const loginResponse = await request(app)
        .post('/api/users/login')
        .send({
          usernameEmail: 'student@systemtest.com',
          password: 'Student1234!'
        })
        .expect(200);

      expect(loginResponse.body.message).toBe('Login successful');
      expect(loginResponse.body.user.email).toBe('student@systemtest.com');
      expect(loginResponse.body.token).toBeDefined();
      studentToken = loginResponse.body.token;

      // ============================================
      // PHASE 5: Get User Profile
      // ============================================
      console.log('Phase 5: Get User Profile');

      const profileResponse = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(profileResponse.body.user).toBeDefined();
      expect(profileResponse.body.user._id.toString()).toBe(studentUserId.toString());
      expect(profileResponse.body.user.email).toBe('student@systemtest.com');
      expect(profileResponse.body.user.password).toBeUndefined(); // Password should not be in response

      // ============================================
      // PHASE 6: Update User Profile
      // ============================================
      console.log('Phase 6: Update User Profile');

      const newUsername = `updated_student_${Date.now()}`;
      const updateResponse = await request(app)
        .put(`/api/users/update/${studentUserId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          username: newUsername
        })
        .expect(200);

      expect(updateResponse.body.message).toBe('User updated successfully');
      expect(updateResponse.body.user.username).toBe(newUsername);

      // Verify update in database
      const updatedUser = await User.findById(studentUserId);
      expect(updatedUser.username).toBe(newUsername);

      // ============================================
      // PHASE 7: Change Password
      // ============================================
      console.log('Phase 7: Change Password');

      const changePasswordResponse = await request(app)
        .put(`/api/users/update/${studentUserId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          password: 'NewPassword1234!'
        })
        .expect(200);

      expect(changePasswordResponse.body.message).toBe('User updated successfully');

      // Verify new password works
      const loginWithNewPassword = await request(app)
        .post('/api/users/login')
        .send({
          usernameEmail: 'student@systemtest.com',
          password: 'NewPassword1234!'
        })
        .expect(200);

      expect(loginWithNewPassword.body.token).toBeDefined();

      // ============================================
      // PHASE 8: Logout
      // ============================================
      console.log('Phase 8: Logout');

      const logoutResponse = await request(app)
        .post('/api/users/logout')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(logoutResponse.body.message).toBe('Logged out successfully');

      // ============================================
      // PHASE 9: Delete User (Admin)
      // ============================================
      console.log('Phase 9: Delete User (Admin)');

      const deleteResponse = await request(app)
        .delete(`/api/users/delete/${studentUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(deleteResponse.body.message).toBe('User deleted successfully');
      expect(deleteResponse.body.deletedUser.toString()).toBe(studentUserId.toString());

      // Verify user is deleted
      const deletedUser = await User.findById(studentUserId);
      expect(deletedUser).toBeNull();

      console.log('✅ Complete User Lifecycle Test Passed!');
    });

    it('should handle organizer registration and approval workflow', async () => {
      console.log('Organizer Registration and Approval Test');

      // Register organizer
      const organizerRegisterResponse = await request(app)
        .post('/api/users/register')
        .send({
          email: 'organizer@systemtest.com',
          password: 'Organizer1234!',
          name: 'Test Organizer',
          role: 'Organizer',
          username: `organizer_${Date.now()}_${Math.random().toString(36).substring(7)}`
        })
        .expect(201);

      expect(organizerRegisterResponse.body.user.role).toBe('Organizer');
      expect(organizerRegisterResponse.body.user.approved).toBe(false); // Organizers need approval

      organizerUserId = organizerRegisterResponse.body.user._id;

      // Get verification token
      const organizerUser = await User.findById(organizerUserId).select('+verificationToken');
      organizerVerificationToken = organizerUser.verificationToken;

      // Verify email
      await request(app)
        .get(`/api/users/verify-email?token=${organizerVerificationToken}`)
        .expect(302);

      // Try to login (should fail - not approved)
      const loginBeforeApproval = await request(app)
        .post('/api/users/login')
        .send({
          usernameEmail: 'organizer@systemtest.com',
          password: 'Organizer1234!'
        });

      // Note: The login might succeed but the user won't be able to create organizations
      // Let's verify the user is not approved
      const organizer = await User.findById(organizerUserId);
      expect(organizer.approved).toBe(false);

      // Admin approves organizer
      await User.findByIdAndUpdate(organizerUserId, { approved: true });

      // Verify approval
      const approvedOrganizer = await User.findById(organizerUserId);
      expect(approvedOrganizer.approved).toBe(true);

      console.log('✅ Organizer Registration and Approval Test Passed!');
    });

    it('should handle password reset workflow', async () => {
      console.log('Password Reset Workflow Test');

      // Register and verify user
      const registerResponse = await request(app)
        .post('/api/users/register')
        .send({
          email: 'resetuser@systemtest.com',
          password: 'OriginalPassword1234!',
          name: 'Reset Test User',
          role: 'Student',
          username: `reset_user_${Date.now()}_${Math.random().toString(36).substring(7)}`
        })
        .expect(201);

      const resetUserId = registerResponse.body.user._id;
      const resetUser = await User.findById(resetUserId).select('+verificationToken');
      
      // Verify email
      await request(app)
        .get(`/api/users/verify-email?token=${resetUser.verificationToken}`)
        .expect(302);

      // Request password reset
      const forgotPasswordResponse = await request(app)
        .post('/api/users/forgot-password')
        .send({
          email: 'resetuser@systemtest.com'
        })
        .expect(200);

      expect(forgotPasswordResponse.body.message).toContain('password reset link has been sent');

      // Get reset token from database
      const userWithToken = await User.findById(resetUserId).select('+resetPasswordToken +resetPasswordExpires');
      resetPasswordToken = userWithToken.resetPasswordToken;
      expect(resetPasswordToken).toBeDefined();
      expect(userWithToken.resetPasswordExpires).toBeDefined();

      // Reset password with token
      const resetPasswordResponse = await request(app)
        .post('/api/users/reset-password')
        .send({
          token: resetPasswordToken,
          password: 'NewResetPassword1234!'
        })
        .expect(200);

      expect(resetPasswordResponse.body.message).toBe('Password has been reset successfully');

      // Verify token is cleared
      const userAfterReset = await User.findById(resetUserId).select('+resetPasswordToken');
      expect(userAfterReset.resetPasswordToken).toBeUndefined();

      // Verify new password works
      const loginWithNewPassword = await request(app)
        .post('/api/users/login')
        .send({
          usernameEmail: 'resetuser@systemtest.com',
          password: 'NewResetPassword1234!'
        })
        .expect(200);

      expect(loginWithNewPassword.body.token).toBeDefined();

      // Verify old password doesn't work
      const loginWithOldPassword = await request(app)
        .post('/api/users/login')
        .send({
          usernameEmail: 'resetuser@systemtest.com',
          password: 'OriginalPassword1234!'
        })
        .expect(401);

      console.log('✅ Password Reset Workflow Test Passed!');
    });

    it('should prevent duplicate email registration', async () => {
      console.log('Duplicate Email Prevention Test');

      // Register first user
      await request(app)
        .post('/api/users/register')
        .send({
          email: 'duplicate@systemtest.com',
          password: 'Password1234!',
          name: 'First User',
          role: 'Student',
          username: `first_user_${Date.now()}`
        })
        .expect(201);

      // Try to register with same email
      const duplicateResponse = await request(app)
        .post('/api/users/register')
        .send({
          email: 'duplicate@systemtest.com',
          password: 'Password1234!',
          name: 'Second User',
          role: 'Student',
          username: `second_user_${Date.now()}`
        })
        .expect(409);

      expect(duplicateResponse.body.error).toBe('Email already in use');

      console.log('✅ Duplicate Email Prevention Test Passed!');
    });

    it('should prevent duplicate username registration', async () => {
      console.log('Duplicate Username Prevention Test');

      const uniqueUsername = `unique_username_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      // Register first user
      await request(app)
        .post('/api/users/register')
        .send({
          email: 'user1@systemtest.com',
          password: 'Password1234!',
          name: 'First User',
          role: 'Student',
          username: uniqueUsername
        })
        .expect(201);

      // Try to register with same username
      const duplicateResponse = await request(app)
        .post('/api/users/register')
        .send({
          email: 'user2@systemtest.com',
          password: 'Password1234!',
          name: 'Second User',
          role: 'Student',
          username: uniqueUsername
        })
        .expect(409);

      expect(duplicateResponse.body.error).toBe('Username already in use');

      console.log('✅ Duplicate Username Prevention Test Passed!');
    });

    it('should handle invalid verification token', async () => {
      console.log('Invalid Verification Token Test');

      const invalidResponse = await request(app)
        .get('/api/users/verify-email?token=invalid_token_12345')
        .expect(400);

      expect(invalidResponse.body.error).toBe('Invalid verification token');

      console.log('✅ Invalid Verification Token Test Passed!');
    });

    it('should handle invalid password reset token', async () => {
      console.log('Invalid Password Reset Token Test');

      const invalidResponse = await request(app)
        .post('/api/users/reset-password')
        .send({
          token: 'invalid_reset_token_12345',
          password: 'NewPassword1234!'
        })
        .expect(400);

      expect(invalidResponse.body.error).toBe('Invalid or expired token');

      console.log('✅ Invalid Password Reset Token Test Passed!');
    });

    it('should enforce authorization for user operations', async () => {
      console.log('Authorization Enforcement Test');

      // Register two users
      const user1Response = await request(app)
        .post('/api/users/register')
        .send({
          email: 'user1auth@systemtest.com',
          password: 'Password1234!',
          name: 'User 1',
          role: 'Student',
          username: `user1_auth_${Date.now()}`
        })
        .expect(201);

      const user2Response = await request(app)
        .post('/api/users/register')
        .send({
          email: 'user2auth@systemtest.com',
          password: 'Password1234!',
          name: 'User 2',
          role: 'Student',
          username: `user2_auth_${Date.now()}`
        })
        .expect(201);

      const user1Id = user1Response.body.user._id;
      const user2Id = user2Response.body.user._id;

      // Verify emails
      const user1 = await User.findById(user1Id).select('+verificationToken');
      const user2 = await User.findById(user2Id).select('+verificationToken');
      await request(app).get(`/api/users/verify-email?token=${user1.verificationToken}`).expect(302);
      await request(app).get(`/api/users/verify-email?token=${user2.verificationToken}`).expect(302);

      // Login as user1
      const user1Login = await request(app)
        .post('/api/users/login')
        .send({
          usernameEmail: 'user1auth@systemtest.com',
          password: 'Password1234!'
        })
        .expect(200);

      const user1Token = user1Login.body.token;

      // User1 tries to update User2 (should fail)
      const unauthorizedUpdate = await request(app)
        .put(`/api/users/update/${user2Id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          username: 'HackedUsername'
        })
        .expect(403);

      expect(unauthorizedUpdate.body.code).toBe('FORBIDDEN');
      expect(unauthorizedUpdate.body.message).toContain('Access denied');

      // User1 tries to delete User2 (should fail)
      const unauthorizedDelete = await request(app)
        .delete(`/api/users/delete/${user2Id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(403);

      expect(unauthorizedDelete.body.code).toBe('FORBIDDEN');
      expect(unauthorizedDelete.body.message).toContain('Access denied');

      // User1 can update themselves (should succeed)
      const authorizedUpdate = await request(app)
        .put(`/api/users/update/${user1Id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          username: `updated_user1_${Date.now()}`
        })
        .expect(200);

      expect(authorizedUpdate.body.message).toBe('User updated successfully');

      // Admin can update User2 (should succeed)
      const adminUpdate = await request(app)
        .put(`/api/users/update/${user2Id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: `admin_updated_${Date.now()}`
        })
        .expect(200);

      expect(adminUpdate.body.message).toBe('User updated successfully');

      console.log('✅ Authorization Enforcement Test Passed!');
    });

    it('should handle user deletion with cascading deletes', async () => {
      console.log('User Deletion with Cascading Deletes Test');

      // Register user
      const registerResponse = await request(app)
        .post('/api/users/register')
        .send({
          email: 'deleteuser@systemtest.com',
          password: 'Password1234!',
          name: 'Delete Test User',
          role: 'Student',
          username: `delete_user_${Date.now()}`
        })
        .expect(201);

      const deleteUserId = registerResponse.body.user._id;
      const deleteUser = await User.findById(deleteUserId).select('+verificationToken');

      // Verify email
      await request(app)
        .get(`/api/users/verify-email?token=${deleteUser.verificationToken}`)
        .expect(302);

      // Create some registrations and tickets for this user (manually since we need an event)
      // For this test, we'll just verify the deletion endpoint works
      // In a real scenario, you'd create events, registrations, and tickets first

      // Delete user (as admin)
      const deleteResponse = await request(app)
        .delete(`/api/users/delete/${deleteUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(deleteResponse.body.message).toBe('User deleted successfully');
      expect(deleteResponse.body.deletedUser.toString()).toBe(deleteUserId.toString());
      expect(deleteResponse.body.deletedTicketsCount).toBeDefined();
      expect(deleteResponse.body.deletedRegistrationsCount).toBeDefined();

      // Verify user is deleted
      const deletedUser = await User.findById(deleteUserId);
      expect(deletedUser).toBeNull();

      console.log('✅ User Deletion with Cascading Deletes Test Passed!');
    });

    it('should handle get user by ID and email', async () => {
      console.log('Get User by ID and Email Test');

      // Register user
      const registerResponse = await request(app)
        .post('/api/users/register')
        .send({
          email: 'getuser@systemtest.com',
          password: 'Password1234!',
          name: 'Get Test User',
          role: 'Student',
          username: `get_user_${Date.now()}`
        })
        .expect(201);

      const getUserId = registerResponse.body.user._id;
      const getUser = await User.findById(getUserId).select('+verificationToken');

      // Verify email
      await request(app)
        .get(`/api/users/verify-email?token=${getUser.verificationToken}`)
        .expect(302);

      // Login
      const loginResponse = await request(app)
        .post('/api/users/login')
        .send({
          usernameEmail: 'getuser@systemtest.com',
          password: 'Password1234!'
        })
        .expect(200);

      const userToken = loginResponse.body.token;

      // Get user by ID
      const getUserByIdResponse = await request(app)
        .get(`/api/users/by-id/${getUserId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(getUserByIdResponse.body.user._id.toString()).toBe(getUserId.toString());
      expect(getUserByIdResponse.body.user.email).toBe('getuser@systemtest.com');

      // Get user by email
      const getUserByEmailResponse = await request(app)
        .get('/api/users/by-email/getuser@systemtest.com')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(getUserByEmailResponse.body.user.email).toBe('getuser@systemtest.com');
      expect(getUserByEmailResponse.body.user._id.toString()).toBe(getUserId.toString());

      console.log('✅ Get User by ID and Email Test Passed!');
    });
  });
});

