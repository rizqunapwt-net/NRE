import axios from 'axios';
import { message } from 'antd';
import { API_V1_BASE } from './base';

const api = axios.create({
    baseURL: API_V1_BASE,
    timeout: 15000,
    withCredentials: true,
    headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json',
    },
});

// Interceptor to add JWT token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for error handling and token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Only redirect to login for non-public endpoints
        const publicPaths = ['/api/v1/public/', '/api/v1/search'];
        const isPublicEndpoint = publicPaths.some(path => error.config?.url?.includes(path));

        // Handle 401 - Unauthorized
        if (error.response?.status === 401 && !isPublicEndpoint) {
            // Check if this is the first 401 for this request (not a retry)
            if (!originalRequest._retry) {
                originalRequest._retry = true;

                // Try to refresh token
                try {
                    const refreshToken = localStorage.getItem('refresh_token');
                    if (refreshToken) {
                        const response = await axios.post(`${API_V1_BASE}/auth/refresh`, {
                            refresh_token: refreshToken,
                        }, { withCredentials: true });

                        const { token, refresh_token } = response.data.data || response.data;
                        localStorage.setItem('token', token);
                        if (refresh_token) {
                            localStorage.setItem('refresh_token', refresh_token);
                        }

                        // Retry original request with new token
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return api(originalRequest);
                    }
                } catch (refreshError) {
                    // Refresh failed, clear tokens and redirect to login
                    localStorage.removeItem('token');
                    localStorage.removeItem('refresh_token');
                    if (!window.location.pathname.includes('/login')) {
                        window.location.href = '/login';
                    }
                }
            } else {
                // Already retried, clear tokens and redirect
                localStorage.removeItem('token');
                localStorage.removeItem('refresh_token');
                if (!window.location.pathname.includes('/login')) {
                    window.location.href = '/login';
                }
            }
        }

        // Global Error Message handling
        if (error.response?.data?.message) {
            message.error(error.response.data.message);
        } else if (error.message === 'Network Error') {
            message.error('Koneksi terputus. Harap periksa internet Anda.');
        } else if (error.response?.status === 500) {
            message.error('Terjadi kesalahan server. Mohon coba lagi nanti.');
        }

        return Promise.reject(error);
    }
);

export default api;
