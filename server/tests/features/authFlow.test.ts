import request from 'supertest';
import { app } from '../../src/app.js';
import prisma from '../../src/prisma/client.js';

describe('Feature Test: Complete Authentication Flow', () => {
  it('should register, login, access protected route, and logout successfully', async () => {
    const name = 'Feature Flow User';
    const email = 'flowuser@example.com';
    const password = 'ValidPassword@1';

    // 1. Register a new user
    const registerResponse = await request(app).post('/api/v1/auth/register').send({
      name,
      email,
      password,
      password_confirmation: password,
    });

    expect(registerResponse.statusCode).toBe(201);
    expect(registerResponse.body).toHaveProperty('success');
    expect(registerResponse.body.success).toBe(true);

    // Verify user is in DB
    const userInDb = await prisma.users.findUnique({ where: { email } });
    expect(userInDb).not.toBeNull();
    expect(userInDb.name).toBe(name);

    // 2. Login as the newly registered user
    const loginResponse = await request(app).post('/api/v1/auth/login').send({
      email,
      password,
    });

    expect(loginResponse.statusCode).toBe(200);
    expect(loginResponse.body).toHaveProperty('success');
    expect(loginResponse.body.success).toBe(true);

    // Capture auth cookies
    const authCookies = loginResponse.headers['set-cookie'];
    expect(authCookies).toBeDefined();

    const hasAccessToken = authCookies.some((cookie) => cookie.includes('accessToken'));
    const hasRefreshToken = authCookies.some((cookie) => cookie.includes('refreshToken'));
    expect(hasAccessToken).toBe(true);
    expect(hasRefreshToken).toBe(true);

    // Verify refresh token is created in the database
    const dbRefreshToken = await prisma.refresh_tokens.findFirst({
      where: { user_id: userInDb.id },
    });
    expect(dbRefreshToken).not.toBeNull();

    // 3. Access a protected route (/auth/me) with cookies
    const profileResponse = await request(app).get('/api/v1/auth/me').set('Cookie', authCookies);

    expect(profileResponse.statusCode).toBe(200);
    expect(profileResponse.body).toHaveProperty('success');
    expect(profileResponse.body.success).toBe(true);
    expect(profileResponse.body.data.email).toBe(email);

    // 4. Logout the user
    const logoutResponse = await request(app)
      .post('/api/v1/auth/logout')
      .set('Cookie', authCookies);

    expect(logoutResponse.statusCode).toBe(200);
    expect(logoutResponse.body).toHaveProperty('success');
    expect(logoutResponse.body.success).toBe(true);

    // Verify cookies are cleared
    const clearedCookies = logoutResponse.headers['set-cookie'];
    expect(clearedCookies).toBeDefined();

    // Verify refresh token is deleted from DB
    const dbRefreshTokenAfter = await prisma.refresh_tokens.findFirst({
      where: { user_id: userInDb.id },
    });
    expect(dbRefreshTokenAfter).toBeNull();

    // 5. Assert that accessing protected route now fails
    const failedProfileResponse = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', clearedCookies); // Cookie value cleared (empty/expired)

    expect(failedProfileResponse.statusCode).toBe(401);
    expect(failedProfileResponse.body.success).toBe(false);
  });
});
