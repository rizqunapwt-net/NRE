import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { getRedirectByRole, AuthProvider, useAuth } from './AuthContext';
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

// Mock sessionStorage
const sessionStorage: Record<string, string> = {};
const sessionStorageMock = {
    getItem: vi.fn((key: string) => sessionStorage[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
        sessionStorage[key] = String(value);
    }),
    removeItem: vi.fn((key: string) => {
        delete sessionStorage[key];
    }),
    clear: vi.fn(() => {
        Object.keys(sessionStorage).forEach((key) => delete sessionStorage[key]);
    }),
};

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
});

Object.defineProperty(window, 'sessionStorage', {
    value: sessionStorageMock,
    writable: true,
});

describe('AuthContext', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorageMock.clear();
        sessionStorageMock.clear();
        Object.keys(storage).forEach((key) => delete storage[key]);
        Object.keys(sessionStorage).forEach((key) => delete sessionStorage[key]);
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    describe('getRedirectByRole', () => {
        it('should redirect ADMIN role to dashboard', () => {
            expect(getRedirectByRole('ADMIN')).toBe('/dashboard');
        });

        it('should redirect Admin role (capitalized) to dashboard', () => {
            expect(getRedirectByRole('Admin')).toBe('/dashboard');
        });

        it('should redirect non-admin role to penulis', () => {
            expect(getRedirectByRole('USER')).toBe('/penulis');
        });

        it('should redirect PENULIS role to penulis page', () => {
            expect(getRedirectByRole('PENULIS')).toBe('/penulis');
        });

        it('should redirect empty string to penulis', () => {
            expect(getRedirectByRole('')).toBe('/penulis');
        });
    });

    describe('useAuth Hook', () => {
        it('should throw error when used outside AuthProvider', () => {
            const TestComponent = () => {
                useAuth(); // This should throw
                return null;
            };

            expect(() => {
                render(<TestComponent />);
            }).toThrow('useAuth must be used within an AuthProvider');
        });
    });

    describe('AuthProvider', () => {
        const TestComponent = () => {
            const { user, loading, hasPermission, isAdmin, isPenulis, mustChangePassword } = useAuth();
            return (
                <div>
                    <div data-testid="loading">{loading ? 'loading' : 'loaded'}</div>
                    <div data-testid="user">{user?.name || 'no-user'}</div>
                    <div data-testid="role">{user?.role || 'no-role'}</div>
                    <div data-testid="has-perm">{hasPermission('invoices_read') ? 'yes' : 'no'}</div>
                    <div data-testid="is-admin">{isAdmin() ? 'yes' : 'no'}</div>
                    <div data-testid="is-penulis">{isPenulis() ? 'yes' : 'no'}</div>
                    <div data-testid="must-change">{mustChangePassword() ? 'yes' : 'no'}</div>
                </div>
            );
        };

        it('should render with loading state when no token', async () => {
            const { getByTestId } = render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>,
            );

            await waitFor(() => {
                expect(getByTestId('loading')).toHaveTextContent('loaded');
            });
        });

        it('should load user profile when token exists', async () => {
            localStorageMock.setItem('token', 'test-token');
            (api.get as any).mockResolvedValueOnce({
                data: {
                    success: true,
                    data: {
                        user: {
                            id: 1,
                            email: 'admin@example.com',
                            name: 'Admin User',
                            username: 'admin',
                            roles: ['ADMIN'],
                            is_verified_author: false,
                        },
                    },
                },
            });

            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>,
            );

            await waitFor(() => {
                expect(screen.getByTestId('user')).toHaveTextContent('Admin User');
                expect(screen.getByTestId('role')).toHaveTextContent('ADMIN');
            });
        });

        it('should set user as ADMIN and grant all permissions', async () => {
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
                    <TestComponent />
                </AuthProvider>,
            );

            await waitFor(() => {
                expect(screen.getByTestId('is-admin')).toHaveTextContent('yes');
                expect(screen.getByTestId('has-perm')).toHaveTextContent('yes');
            });
        });

        it('should set user as regular USER with limited permissions', async () => {
            localStorageMock.setItem('token', 'test-token');
            (api.get as any).mockResolvedValueOnce({
                data: {
                    user: {
                        id: 2,
                        email: 'user@example.com',
                        name: 'Regular User',
                        role: 'user',
                        is_verified_author: false,
                    },
                },
            });

            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>,
            );

            await waitFor(() => {
                expect(screen.getByTestId('is-admin')).toHaveTextContent('no');
                expect(screen.getByTestId('has-perm')).toHaveTextContent('no');
            });
        });

        it('should handle must_change_password flag', async () => {
            localStorageMock.setItem('token', 'test-token');
            (api.get as any).mockResolvedValueOnce({
                data: {
                    user: {
                        id: 1,
                        email: 'admin@example.com',
                        name: 'Admin',
                        role: 'admin',
                        must_change_password: true,
                        is_verified_author: false,
                    },
                },
            });

            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>,
            );

            await waitFor(() => {
                expect(screen.getByTestId('must-change')).toHaveTextContent('yes');
            });
        });

        it('should clear token on failed profile fetch', async () => {
            localStorageMock.setItem('token', 'invalid-token');
            (api.get as any).mockRejectedValueOnce(new Error('Unauthorized'));

            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>,
            );

            await waitFor(() => {
                expect(localStorageMock.getItem('token')).toBeNull();
                expect(screen.getByTestId('user')).toHaveTextContent('no-user');
            });
        });

        it('should handle verified author status', async () => {
            localStorageMock.setItem('token', 'test-token');
            (api.get as any).mockResolvedValueOnce({
                data: {
                    user: {
                        id: 3,
                        email: 'author@example.com',
                        name: 'Verified Author',
                        role: 'user',
                        is_verified_author: true,
                    },
                },
            });

            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>,
            );

            await waitFor(() => {
                expect(screen.getByTestId('is-penulis')).toHaveTextContent('yes');
            });
        });

        it('should recognize penulis when verified author', async () => {
            localStorageMock.setItem('token', 'test-token');
            (api.get as any).mockResolvedValueOnce({
                data: {
                    user: {
                        id: 3,
                        email: 'penulis@example.com',
                        name: 'Penulis',
                        role: 'user',
                        is_verified_author: true,
                    },
                },
            });

            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>,
            );

            await waitFor(() => {
                expect(screen.getByTestId('is-penulis')).toHaveTextContent('yes');
            });
        });
    });

    describe('Permission Checking', () => {
        const TestPermission = ({ shouldHavePermission }: { shouldHavePermission: boolean }) => {
            const { hasPermission } = useAuth();
            return (
                <div>
                    <div>{shouldHavePermission && hasPermission('invoices_read') ? 'has' : 'no'}</div>
                </div>
            );
        };

        it('should grant invoices_read permission to ADMIN', async () => {
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
                    <TestPermission shouldHavePermission={true} />
                </AuthProvider>,
            );

            await waitFor(() => {
                expect(screen.getByText('has')).toBeInTheDocument();
            });
        });
    });
});
