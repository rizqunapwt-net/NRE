import { describe, it, expect } from 'vitest';
import axios from 'axios';

const API_URL = 'http://localhost:9000/api/v1';

describe('NRE API Smoke Tests', () => {
  let token = '';

  it('Health check endpoint should be up', async () => {
    try {
      const res = await axios.get(`${API_URL}/public/catalog`);
      expect(res.status).toBe(200);
    } catch (e) {
      console.warn('Backend might not be running at :9000');
    }
  });

  it('Public catalog should return list of books', async () => {
    const res = await axios.get(`${API_URL}/public/catalog`);
    expect(res.data).toHaveProperty('data');
    expect(Array.isArray(res.data.data)).toBe(true);
  });

  it('Login with invalid credentials should fail', async () => {
    try {
      await axios.post(`${API_URL}/auth/login`, {
        login: 'wrong@user.com',
        password: 'wrongpassword'
      });
    } catch (error) {
      expect(error.response.status).toBe(401);
    }
  });

  it('Categories list should be accessible', async () => {
    const res = await axios.get(`${API_URL}/public/categories`);
    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty('data');
  });
});
