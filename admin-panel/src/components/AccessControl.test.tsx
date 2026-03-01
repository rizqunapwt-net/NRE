import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import AccessControl from './AccessControl';
import { AuthProvider } from '../contexts/AuthContext';
import api from '../api';

// Mock API
vi.mock('../api', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
    },
}));

// Mock localStorage
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

describe('AccessControl Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorageMock.clear();
    });

    it('should render children when user has permission', async () => {
        localStorageMock.setItem('token', 'test-token');
        (api.get as any).mockResolvedValueOnce({
            data: {
                user: {
                    id: 1,
                    email: 'admin@example.com',
                    name: 'Admin',
                    role: 'admin',
                    is_verified_author: false,
                },
            },
        });

        render(
            <AuthProvider>
                <AccessControl permission="invoices_read">
                    <div>Protected Content</div>
                </AccessControl>
            </AuthProvider>,
        );

        // Wait for auth to load
        await waitFor(() => {
            expect(screen.queryByText('Protected Content')).toBeInTheDocument();
        }, { timeout: 1000 });
    });

    it('should render fallback when user lacks permission', async () => {
        localStorageMock.setItem('token', 'test-token');
        (api.get as any).mockResolvedValueOnce({
            data: {
                user: {
                    id: 2,
                    email: 'user@example.com',
                    name: 'User',
                    role: 'user',
                    is_verified_author: false,
                },
            },
        });

        render(
            <AuthProvider>
                <AccessControl permission="invoices_read" fallback={<div>No Access</div>}>
                    <div>Protected Content</div>
                </AccessControl>
            </AuthProvider>,
        );

        // Wait for auth to load and check fallback
        await waitFor(() => {
            expect(screen.queryByText('No Access')).toBeInTheDocument();
        }, { timeout: 1000 });
    });

    it('should render null as fallback by default', async () => {
        localStorageMock.setItem('token', 'test-token');
        (api.get as any).mockResolvedValueOnce({
            data: {
                user: {
                    id: 2,
                    email: 'user@example.com',
                    name: 'User',
                    role: 'user',
                    is_verified_author: false,
                },
            },
        });

        const { container } = render(
            <AuthProvider>
                <AccessControl permission="invoices_read">
                    <div>Protected Content</div>
                </AccessControl>
            </AuthProvider>,
        );

        // Wait for auth to load
        await waitFor(() => {
            expect(container.textContent).not.toContain('Protected Content');
        }, { timeout: 1000 });
    });

    it('should handle loading state correctly', () => {
        const { container } = render(
            <AuthProvider>
                <AccessControl permission="invoices_read">
                    <div>Protected Content</div>
                </AccessControl>
            </AuthProvider>,
        );

        // During loading, should render null
        expect(container.textContent).toBe('');
    });

    it('should render custom fallback component', async () => {
        localStorageMock.setItem('token', 'test-token');
        (api.get as any).mockResolvedValueOnce({
            data: {
                user: {
                    id: 2,
                    email: 'user@example.com',
                    name: 'User',
                    role: 'user',
                    is_verified_author: false,
                },
            },
        });

        const fallback = <div className="access-denied">Access Denied</div>;

        render(
            <AuthProvider>
                <AccessControl permission="invoices_read" fallback={fallback}>
                    <div>Protected Content</div>
                </AccessControl>
            </AuthProvider>,
        );

        // Wait for auth to load
        await waitFor(() => {
            expect(screen.queryByText('Access Denied')).toBeInTheDocument();
        }, { timeout: 1000 });
    });

    it('should check different permissions', async () => {
        localStorageMock.setItem('token', 'test-token');
        (api.get as any).mockResolvedValueOnce({
            data: {
                user: {
                    id: 1,
                    email: 'admin@example.com',
                    name: 'Admin',
                    role: 'admin',
                    is_verified_author: false,
                },
            },
        });

        render(
            <AuthProvider>
                <AccessControl permission="settings_write">
                    <div>Settings Access</div>
                </AccessControl>
            </AuthProvider>,
        );

        // Wait for auth to load
        await waitFor(() => {
            expect(screen.queryByText('Settings Access')).toBeInTheDocument();
        }, { timeout: 1000 });
    });
});
