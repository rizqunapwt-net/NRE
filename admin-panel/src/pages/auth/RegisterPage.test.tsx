import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import RegisterPage from './RegisterPage';
import axios from 'axios';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return { ...actual, useNavigate: () => mockNavigate };
});

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

Object.defineProperty(window, 'location', {
    value: { href: '' },
    writable: true,
});

function renderRegister() {
    return render(
        <MemoryRouter>
            <RegisterPage />
        </MemoryRouter>,
    );
}

beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    mockNavigate.mockClear();
    window.location.href = '';
    vi.mocked(axios.get).mockResolvedValue({});
});

afterEach(() => {
    vi.useRealTimers();
});

describe('RegisterPage', () => {
    it('renders latest registration UI', () => {
        renderRegister();

        expect(screen.getByRole('heading', { name: 'Daftar Akun' })).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Nama Lengkap')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Email Utama')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Password (min. 8 karakter)')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Konfirmasi Password')).toBeInTheDocument();
        expect(screen.getByText('Daftar dengan Google')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Buat Akun Baru' })).toBeInTheDocument();
    });

    it('shows validation error when required fields are empty', async () => {
        const user = userEvent.setup();
        renderRegister();

        await user.click(screen.getByRole('button', { name: 'Buat Akun Baru' }));

        expect(await screen.findByText('Nama lengkap wajib diisi')).toBeInTheDocument();
    });

    it('submits registration and renders success state', async () => {
        const user = userEvent.setup();
        mockApiPost.mockResolvedValueOnce({ data: { message: 'ok' } });
        renderRegister();

        await user.type(screen.getByPlaceholderText('Nama Lengkap'), 'Test User');
        await user.type(screen.getByPlaceholderText('Email Utama'), 'test@example.com');
        await user.type(screen.getByPlaceholderText('Password (min. 8 karakter)'), 'password123');
        await user.type(screen.getByPlaceholderText('Konfirmasi Password'), 'password123');
        await user.click(screen.getByRole('checkbox'));
        await user.click(screen.getByRole('button', { name: 'Buat Akun Baru' }));

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith('/sanctum/csrf-cookie', { withCredentials: true });
            expect(mockApiPost).toHaveBeenCalledWith(
                '/auth/register',
                {
                    name: 'Test User',
                    email: 'test@example.com',
                    password: 'password123',
                    password_confirmation: 'password123',
                },
                { withCredentials: true },
            );
        });

        expect(await screen.findByText('Cek Email Anda!')).toBeInTheDocument();
    });

    it('navigates to login after registration delay', async () => {
        const user = userEvent.setup();
        mockApiPost.mockResolvedValueOnce({ data: { message: 'ok' } });
        renderRegister();

        await user.type(screen.getByPlaceholderText('Nama Lengkap'), 'Test User');
        await user.type(screen.getByPlaceholderText('Email Utama'), 'test@example.com');
        await user.type(screen.getByPlaceholderText('Password (min. 8 karakter)'), 'password123');
        await user.type(screen.getByPlaceholderText('Konfirmasi Password'), 'password123');
        await user.click(screen.getByRole('checkbox'));
        await user.click(screen.getByRole('button', { name: 'Buat Akun Baru' }));

        await screen.findByText('Cek Email Anda!');
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/login', {
                state: { registeredEmail: 'test@example.com' },
            });
        }, { timeout: 4000 });
    }, 10000);

    it('redirects to Google OAuth', async () => {
        const user = userEvent.setup();
        mockApiGet.mockResolvedValueOnce({
            data: { redirect_url: 'https://accounts.google.com/o/oauth2/auth?client_id=test' },
        });

        renderRegister();
        await user.click(screen.getByText('Daftar dengan Google'));

        await waitFor(() => {
            expect(mockApiGet).toHaveBeenCalledWith('/auth/google/redirect');
            expect(window.location.href).toBe('https://accounts.google.com/o/oauth2/auth?client_id=test');
        });
    });

    it('has links to login and terms page', () => {
        renderRegister();

        expect(screen.getByRole('link', { name: 'Masuk di sini' })).toHaveAttribute('href', '/login');
        expect(screen.getByRole('link', { name: 'Ketentuan & Privasi' })).toHaveAttribute('href', '/syarat-ketentuan');
    });
});
