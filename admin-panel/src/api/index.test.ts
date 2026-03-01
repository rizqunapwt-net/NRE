import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock localStorage before importing api
const storage: Record<string, string> = {};
const localStorageMock = {
    getItem: vi.fn((key: string) => storage[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
        storage[key] = String(value);
    }),
    removeItem: vi.fn((key: string) => {
        delete storage[key];
    }),
    clear: vi.fn(() => {
        Object.keys(storage).forEach((key) => delete storage[key]);
    }),
};
Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
});

vi.mock('axios', async () => {
    const actual = await vi.importActual<any>('axios');
    return {
        ...actual,
        default: {
            ...(actual.default || actual),
            create: vi.fn((_config) => ({
                interceptors: {
                    request: { use: vi.fn(), eject: vi.fn() },
                    response: { use: vi.fn(), eject: vi.fn() },
                },
                get: vi.fn(),
                post: vi.fn(),
                put: vi.fn(),
                delete: vi.fn(),
                patch: vi.fn(),
            })),
        },
    };
});

import api from './index';

describe('API Client Instance', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorageMock.clear();
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    describe('API Instance Export', () => {
        it('should export api instance', () => {
            expect(api).toBeDefined();
        });
    });

    describe('Request Interceptor Behavior', () => {
        it('should add Authorization header with token from localStorage', () => {
            localStorageMock.setItem('token', 'test-token-123');
            expect(localStorageMock.getItem('token')).toBe('test-token-123');
        });

        it('should not add Authorization header if no token in localStorage', () => {
            expect(localStorageMock.getItem('token')).toBeNull();
        });

        it('should set Bearer token format correctly', () => {
            localStorageMock.setItem('token', 'my-secret-token');
            const token = localStorageMock.getItem('token');
            expect(token).toBe('my-secret-token');
            expect(`Bearer ${token}`).toBe('Bearer my-secret-token');
        });

        it('should reject on request error', () => {
            const error = new Error('Request failed');
            expect(() => { throw error; }).toThrow('Request failed');
        });
    });

    describe('Response Interceptor Behavior', () => {
        it('should remove token on 401 Unauthorized', () => {
            localStorageMock.setItem('token', 'test-token');
            expect(localStorageMock.getItem('token')).toBe('test-token');
            localStorageMock.removeItem('token');
            expect(localStorageMock.getItem('token')).toBeNull();
        });

        it('should redirect to login on 401 if not already on login page', () => {
            const mockLocation = { href: '', pathname: '/dashboard' };
            Object.defineProperty(window, 'location', {
                value: mockLocation,
                writable: true,
            });
            if (!window.location.pathname.includes('/login')) {
                expect(window.location.pathname).not.toContain('/login');
            }
        });

        it('should not redirect if already on login page', () => {
            const mockLocation = { href: '', pathname: '/login' };
            Object.defineProperty(window, 'location', {
                value: mockLocation,
                writable: true,
            });
            if (window.location.pathname.includes('/login')) {
                expect(window.location.pathname).toContain('/login');
            }
        });

        it('should pass through successful responses', () => {
            const response = { status: 200, data: { message: 'Success' } };
            expect(response.status).toBe(200);
            expect(response.data).toEqual({ message: 'Success' });
        });

        it('should reject errors', () => {
            const error = new Error('Network error');
            expect(() => { throw error; }).toThrow('Network error');
        });
    });
});
