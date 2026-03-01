import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from './LoginPage';
import axios from 'axios';

const mockApiPost = vi.fn();
const mockApiGet = vi.fn();

vi.mock('../../api', () => ({
    default: {
        post: (...args: unknown[]) => mockApiPost(...args),
        get: (...args: unknown[]) => mockApiGet(...args),
    },
}));

vi.mock('axios', () => ({
    default: {
        get: vi.fn(),
    },
}));

const mockLocation = { href: '' };
Object.defineProperty(window, 'location', {
    value: mockLocation,
    writable: true,
});

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

function renderLogin() {
    return render(
        <MemoryRouter>
            <LoginPage />
        </MemoryRouter>,
    );
}

beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    mockLocation.href = '';
    localStorageMock.clear();
    vi.mocked(axios.get).mockResolvedValue({});
});

afterEach(() => {
    vi.useRealTimers();
});

describe('LoginPage', () => {
    it('renders latest login UI', () => {
        renderLogin();

        expect(screen.getByRole('heading', { name: 'Selamat Datang' })).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Email atau Username')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
        expect(screen.getByText('Masuk dengan Google')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Masuk ke Platform' })).toBeInTheDocument();
    });

    it('shows validation when login field is empty', async () => {
        const user = userEvent.setup();
        renderLogin();

        await user.click(screen.getByRole('button', { name: 'Masuk ke Platform' }));

        expect(await screen.findByText('Email atau username wajib diisi')).toBeInTheDocument();
    });

    it('submits login payload, stores token, and redirects with backend URL', async () => {
        const user = userEvent.setup();
        mockApiPost.mockResolvedValueOnce({
            data: {
                data: {
                    access_token: 'test-token-123',
                    redirect_url: '/penulis',
                },
            },
        });

        renderLogin();

        await user.type(screen.getByPlaceholderText('Email atau Username'), 'test@example.com');
        await user.type(screen.getByPlaceholderText('Password'), 'password123');
        await user.click(screen.getByRole('button', { name: 'Masuk ke Platform' }));

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith('/sanctum/csrf-cookie', { withCredentials: true });
            expect(mockApiPost).toHaveBeenCalledWith(
                '/auth/login',
                { login: 'test@example.com', password: 'password123' },
                { withCredentials: true },
            );
            expect(localStorage.getItem('token')).toBe('test-token-123');
        });

        await new Promise((resolve) => setTimeout(resolve, 1100));
        expect(window.location.href).toBe('/penulis');
    });

    it('redirects to Google OAuth when button is clicked', async () => {
        const user = userEvent.setup();
        mockApiGet.mockResolvedValueOnce({
            data: { redirect_url: 'https://accounts.google.com/o/oauth2/auth?client_id=test' },
        });

        renderLogin();
        await user.click(screen.getByText('Masuk dengan Google'));

        await waitFor(() => {
            expect(mockApiGet).toHaveBeenCalledWith('/auth/google/redirect');
            expect(window.location.href).toBe('https://accounts.google.com/o/oauth2/auth?client_id=test');
        });
    });

    it('shows error when Google OAuth fails', async () => {
        const user = userEvent.setup();
        mockApiGet.mockRejectedValueOnce(new Error('Failed'));

        renderLogin();
        await user.click(screen.getByText('Masuk dengan Google'));

        expect(await screen.findByText('Gagal menghubungkan ke Google.')).toBeInTheDocument();
    });

    it('has navigation links to register and forgot password', () => {
        renderLogin();

        expect(screen.getByRole('link', { name: 'Daftar sekarang' })).toHaveAttribute('href', '/register');
        expect(screen.getByRole('link', { name: 'Lupa password?' })).toHaveAttribute('href', '/lupa-password');
    });
});
