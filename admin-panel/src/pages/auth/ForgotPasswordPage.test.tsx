import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ForgotPasswordPage from './ForgotPasswordPage';

// ── Mocks ──

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return { ...actual, useNavigate: () => mockNavigate };
});

const mockApiPost = vi.fn();
vi.mock('../../api', () => ({
    default: {
        post: (...args: unknown[]) => mockApiPost(...args),
    },
}));

// ── Helpers ──

function renderForgotPassword() {
    return render(
        <MemoryRouter>
            <ForgotPasswordPage />
        </MemoryRouter>,
    );
}

// ── Test Data ──

const mockForgotSuccess = {
    data: {
        message: 'Reset link sent to email',
    },
};

// ── Tests ──

beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
});

describe('ForgotPasswordPage', () => {
    describe('UI Rendering', () => {
        it('renders forgot password form correctly', () => {
            renderForgotPassword();

            expect(screen.getByText('Lupa Password?')).toBeInTheDocument();
            expect(screen.getByText(/Masukkan email Anda dan kami akan mengirim link reset password/)).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
            expect(screen.getByText('Kirim Link Reset')).toBeInTheDocument();
            expect(screen.getByText('Kembali ke Login')).toBeInTheDocument();
        });

        it('has branding elements', () => {
            renderForgotPassword();

            expect(screen.getByText('RESET PASSWORD')).toBeInTheDocument();
            expect(screen.getByText(/Jangan khawatir!/)).toBeInTheDocument();
            expect(screen.getByText(/Proses cepat dan mudah/)).toBeInTheDocument();
            expect(screen.getByText(/Link reset dikirim via email/)).toBeInTheDocument();
            expect(screen.getByText(/Password baru bisa langsung digunakan/)).toBeInTheDocument();
        });

        it('has logo link', () => {
            renderForgotPassword();

            const logoLink = screen.getByRole('link', { name: /E-book Sistem/i });
            expect(logoLink).toBeInTheDocument();
        });
    });

    describe('Form Validation', () => {
        it('shows error when email is empty', async () => {
            const user = userEvent.setup();
            renderForgotPassword();

            await user.click(screen.getByText('Kirim Link Reset'));

            expect(await screen.findByText('Email wajib diisi')).toBeInTheDocument();
        });

        it('shows error for invalid email format', async () => {
            const user = userEvent.setup();
            renderForgotPassword();

            await user.type(screen.getByPlaceholderText('Email'), 'invalid-email');
            await user.click(screen.getByText('Kirim Link Reset'));

            expect(await screen.findByText('Format email tidak valid')).toBeInTheDocument();
        });
    });

    describe('Forgot Password Flow', () => {
        it('submits forgot password request successfully', async () => {
            const user = userEvent.setup();
            mockApiPost.mockResolvedValueOnce(mockForgotSuccess);
            renderForgotPassword();

            await user.type(screen.getByPlaceholderText('Email'), 'test@example.com');
            await user.click(screen.getByText('Kirim Link Reset'));

            await waitFor(() => {
                expect(mockApiPost).toHaveBeenCalledWith('/auth/forgot-password', {
                    email: 'test@example.com',
                }, { withCredentials: true });
            });
        });

        it('shows success page after sending reset link', async () => {
            const user = userEvent.setup();
            mockApiPost.mockResolvedValueOnce(mockForgotSuccess);
            renderForgotPassword();

            await user.type(screen.getByPlaceholderText('Email'), 'test@example.com');
            await user.click(screen.getByText('Kirim Link Reset'));

            await waitFor(() => {
                expect(screen.getByText('Cek Email Anda!')).toBeInTheDocument();
            });
        });

        it('displays the email address on success page', async () => {
            const user = userEvent.setup();
            mockApiPost.mockResolvedValueOnce(mockForgotSuccess);
            renderForgotPassword();

            await user.type(screen.getByPlaceholderText('Email'), 'test@example.com');
            await user.click(screen.getByText('Kirim Link Reset'));

            await waitFor(() => {
                expect(screen.getByText('test@example.com')).toBeInTheDocument();
            });
        });

        it('navigates to login after clicking back button', async () => {
            const user = userEvent.setup();
            mockApiPost.mockResolvedValueOnce(mockForgotSuccess);
            renderForgotPassword();

            await user.type(screen.getByPlaceholderText('Email'), 'test@example.com');
            await user.click(screen.getByText('Kirim Link Reset'));

            await waitFor(() => {
                expect(screen.getByText('Kembali ke Login')).toBeInTheDocument();
            });

            await user.click(screen.getByText('Kembali ke Login'));
            expect(mockNavigate).toHaveBeenCalledWith('/login');
        });

        it('shows error message on failure', async () => {
            const user = userEvent.setup();
            mockApiPost.mockRejectedValueOnce({
                response: { data: { message: 'Email tidak ditemukan' } },
            });
            renderForgotPassword();

            await user.type(screen.getByPlaceholderText('Email'), 'notfound@example.com');
            await user.click(screen.getByText('Kirim Link Reset'));

            await waitFor(() => {
                expect(screen.getByText('Email tidak ditemukan')).toBeInTheDocument();
            });
        });
    });

    describe('Navigation', () => {
        it('has login link to /login', () => {
            renderForgotPassword();

            const link = screen.getAllByRole('link', { name: /Kembali ke Login/i })[0];
            expect(link).toHaveAttribute('href', '/login');
        });
    });

    describe('Error Handling', () => {
        it('clears error when close button is clicked', async () => {
            const user = userEvent.setup();
            mockApiPost.mockRejectedValueOnce({
                response: { data: { message: 'Gagal mengirim email' } },
            });
            renderForgotPassword();

            await user.type(screen.getByPlaceholderText('Email'), 'test@example.com');
            await user.click(screen.getByText('Kirim Link Reset'));

            await waitFor(() => {
                expect(screen.getByText('Gagal mengirim email')).toBeInTheDocument();
            });

            const closeButton = screen.getByRole('button', { name: /close/i });
            await user.click(closeButton);

            expect(screen.queryByText('Gagal mengirim email')).not.toBeInTheDocument();
        });

        it('shows generic error message when no specific error provided', async () => {
            const user = userEvent.setup();
            mockApiPost.mockRejectedValueOnce(new Error('Network error'));
            renderForgotPassword();

            await user.type(screen.getByPlaceholderText('Email'), 'test@example.com');
            await user.click(screen.getByText('Kirim Link Reset'));

            await waitFor(() => {
                expect(screen.getByText('Gagal mengirim email reset password.')).toBeInTheDocument();
            });
        });
    });

    describe('Success Page Content', () => {
        it('shows helpful message about checking spam folder', async () => {
            const user = userEvent.setup();
            mockApiPost.mockResolvedValueOnce(mockForgotSuccess);
            renderForgotPassword();

            await user.type(screen.getByPlaceholderText('Email'), 'test@example.com');
            await user.click(screen.getByText('Kirim Link Reset'));

            await waitFor(() => {
                expect(screen.getByText(/Jika Anda tidak melihat email, cek folder spam/)).toBeInTheDocument();
            });
        });
    });
});
