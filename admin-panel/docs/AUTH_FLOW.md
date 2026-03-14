# 🔐 Auth Flow Documentation - NRE Frontend

## Overview
Complete authentication flow dengan support:
- ✅ Login (Email + Password)
- ✅ Register (dengan role selection)
- ✅ Forgot Password
- ✅ Reset Password
- ✅ Email Verification
- ✅ Social Login (Google OAuth)
- ✅ Remember Me (localStorage vs sessionStorage)
- ✅ Token Refresh (auto-renew expired tokens)
- ✅ Role-based Redirect (Admin/Author/User)
- ✅ Intended URL (redirect after login)

---

## 📁 File Structure

```
admin-panel/src/
├── api/
│   ├── index.ts              # Axios instance dengan interceptors
│   └── base.ts               # Base URL configuration
├── contexts/
│   └── AuthContext.tsx       # Auth state management
├── pages/auth/
│   ├── LoginPage.tsx         # /login
│   ├── RegisterPage.tsx      # /register
│   ├── AuthorRegisterPage.tsx # /author-register
│   ├── ForgotPasswordPage.tsx # /lupa-password
│   ├── ResetPasswordPage.tsx  # /reset-password
│   ├── VerifyEmailPage.tsx    # /verify-email
│   ├── ChangePasswordPage.tsx # /ganti-password
│   ├── ProfilePage.tsx        # /profile
│   └── GoogleCallbackPage.tsx # /auth/google/callback
└── components/
    └── RouteGuards.tsx       # AuthGuard, AuthorGuard
```

---

## 🔑 Auth Endpoints (Backend API)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | Login dengan email + password |
| POST | `/api/v1/auth/register` | Register user baru |
| POST | `/api/v1/auth/forgot-password` | Request reset password |
| POST | `/api/v1/auth/reset-password` | Reset password dengan token |
| GET | `/api/v1/auth/verify-email/{id}/{hash}` | Verify email |
| POST | `/api/v1/auth/logout` | Logout user |
| GET | `/api/v1/auth/me` | Get current user profile |
| GET | `/api/v1/auth/google/redirect` | Redirect ke Google OAuth |
| GET | `/api/v1/auth/google/callback` | Google OAuth callback |
| POST | `/api/v1/auth/refresh` | Refresh JWT token |

---

## 🎯 Features Implementation

### 1. **Login dengan Remember Me**

```tsx
// LoginPage.tsx
const handleLogin = async (values: any) => {
  await login(values.email, values.password, values.remember);
  navigate(from, { replace: true });
};
```

**Storage Strategy:**
- **Remember Me (checked)**: Token disimpan di `localStorage` (persist even after browser close)
- **Remember Me (unchecked)**: Token disimpan di `sessionStorage` (cleared when browser closes)

```ts
// AuthContext.tsx
if (remember) {
  localStorage.setItem('token', token);
  localStorage.setItem('refresh_token', refreshToken);
  localStorage.setItem('login_timestamp', Date.now().toString());
} else {
  sessionStorage.setItem('token', token);
  sessionStorage.setItem('refresh_token', refreshToken);
}
```

---

### 2. **Token Refresh Mechanism**

```ts
// api/index.ts - Response Interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post('/auth/refresh', {
            refresh_token: refreshToken,
          });

          const { token, refresh_token } = response.data.data;
          localStorage.setItem('token', token);
          if (refresh_token) {
            localStorage.setItem('refresh_token', refresh_token);
          }

          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest); // Retry original request
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);
```

---

### 3. **Intended URL (Redirect After Login)**

```tsx
// LoginPage.tsx
const from = location.state?.from?.pathname || '/dashboard';

// AuthGuard.tsx
if (!user) {
  auth.setIntendedUrl(location.pathname);
  return <Navigate to="/login" state={{ from: location }} replace />;
}
```

**Flow:**
1. User akses `/admin/books` (belum login)
2. AuthGuard simpan `/admin/books` ke `sessionStorage` sebagai `intended_url`
3. Redirect ke `/login`
4. Setelah login sukses, redirect kembali ke `/admin/books`

---

### 4. **Role-Based Redirect**

```ts
// AuthContext.tsx
export const getRedirectByRole = (role: string): string => {
  if (role === 'ADMIN' || role === 'Admin') return '/dashboard';
  if (role === 'USER' || role === 'User') return '/penulis';
  return '/penulis';
};
```

**Roles:**
- **Admin** → `/dashboard` (Admin panel)
- **User/Author** → `/penulis` (Author portal)

---

### 5. **Form Validation**

**Client-side (Yup + Ant Design):**
```tsx
<Form.Item
  name="email"
  rules={[
    { required: true, message: 'Email wajib diisi' },
    { type: 'email', message: 'Format email tidak valid' }
  ]}
>
  <Input placeholder="anda@email.com" />
</Form.Item>

<Form.Item
  name="password"
  rules={[
    { required: true, message: 'Password wajib diisi' },
    { min: 8, message: 'Password minimal 8 karakter' }
  ]}
>
  <Input.Password />
</Form.Item>
```

**Server-side:**
```tsx
try {
  await api.post('/auth/login', { email, password });
} catch (err: any) {
  setError(err.response?.data?.message || 'Login gagal');
}
```

---

### 6. **Loading States & Error Messages**

```tsx
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

const handleLogin = async (values: any) => {
  setLoading(true);
  setError(null);

  try {
    await login(values.email, values.password);
    navigate(from);
  } catch (err: any) {
    setError(err.message || 'Login gagal. Periksa email dan password Anda.');
  } finally {
    setLoading(false);
  }
};

// UI
<Button loading={loading} htmlType="submit">
  {loading ? 'Menghubungkan...' : 'Masuk Sekarang'}
</Button>

{error && (
  <Alert type="error" message={error} showIcon closable />
)}
```

---

### 7. **Logout Functionality**

```ts
// AuthContext.tsx
const logout = async () => {
  try {
    await api.post('/auth/logout');
  } catch {
    // Token may already be expired
  }
  // Clear all storage
  localStorage.removeItem('token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('login_timestamp');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('refresh_token');
  setUser(null);
  window.location.href = '/login';
};
```

---

### 8. **Social Login (Google OAuth)**

```tsx
// LoginPage.tsx
const handleGoogleLogin = () => {
  window.location.href = '/api/v1/auth/google/redirect';
};

// GoogleCallbackPage.tsx
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  
  if (token) {
    localStorage.setItem('token', token);
    window.location.href = getRedirectByRole(userRole);
  }
}, []);
```

---

## 🔄 Auth Flow Diagram

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  Access Page    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     No      ┌──────────────┐
│  AuthGuard?     │────────────>│  /login      │
└────────┬────────┘             └──────┬───────┘
         │ Yes                          │
         │                              │
         ▼                              ▼
┌─────────────────┐             ┌──────────────┐
│  Check Token    │             │ Login Form   │
└────────┬────────┘             └──────┬───────┘
         │                             │
    ┌────┴────┐                        │
    │         │                        │
  Valid   Expired                      │
    │         │                        │
    │         ▼                        │
    │   ┌─────────────┐                │
    │   │ Refresh     │                │
    │   │ Token       │                │
    │   └──────┬──────┘                │
    │          │                       │
    │     Success                      │
    │          │                       │
    │          ▼                       │
    │    ┌─────────────┐               │
    │    │ Retry       │               │
    │    │ Request     │               │
    │    └──────┬──────┘               │
    │           │                      │
    │           ▼                      │
    │     ┌─────────────┐              │
    │     │ Load Page   │              │
    │     └─────────────┘              │
    │                                  │
    │         Fail                     │
    │          │                       │
    │          ▼                       │
    └──────────┼───────────────────────┘
               │
               ▼
        ┌──────────────┐
        │ Clear Token  │
        │ Redirect     │
        └──────────────┘
```

---

## 🛡️ Security Best Practices

1. **Token Storage**
   - Use `localStorage` for "Remember Me" (persistent)
   - Use `sessionStorage` for session-only (cleared on browser close)

2. **Token Refresh**
   - Auto-refresh expired tokens before making API calls
   - Clear all tokens if refresh fails

3. **CSRF Protection**
   - `withCredentials: true` for cookies
   - `X-Requested-With: XMLHttpRequest` header

4. **Logout Cleanup**
   - Clear both localStorage and sessionStorage
   - Call backend logout endpoint

5. **Error Handling**
   - Don't redirect on public endpoints
   - Show user-friendly error messages

---

## 📝 Usage Examples

### Login with Remember Me
```tsx
import { useAuth } from './contexts/AuthContext';

const { login } = useAuth();

// Login with remember me
await login('user@example.com', 'password123', true);

// Login without remember me (session only)
await login('user@example.com', 'password123', false);
```

### Check User Role
```tsx
const { user, isAdmin, isPenulis } = useAuth();

if (isAdmin()) {
  // Show admin features
}

if (isPenulis()) {
  // Show author features
}
```

### Check Permission
```tsx
const { hasPermission } = useAuth();

if (hasPermission('publishing_write')) {
  // Show edit button
}
```

### Protected Route
```tsx
<Route
  path="/admin/books"
  element={
    <AuthGuard>
      <BookManagementPage />
    </AuthGuard>
  }
/>
```

---

## 🎨 UI Components

### Login Page Features
- ✅ Email + Password form
- ✅ Remember me checkbox
- ✅ Forgot password link
- ✅ Social login (Google)
- ✅ Register links
- ✅ Loading state
- ✅ Error messages
- ✅ Responsive design

### Register Page Features
- ✅ Name, Email, Phone, Password
- ✅ Password confirmation
- ✅ Terms & Conditions checkbox
- ✅ Password strength indicator
- ✅ Success page after registration

### Forgot Password Features
- ✅ Email input
- ✅ Success message
- ✅ Error handling
- ✅ Back to login link

---

## 🧪 Testing

```tsx
// LoginPage.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import LoginPage from './LoginPage';

test('shows error on invalid credentials', async () => {
  render(<LoginPage />);
  
  fireEvent.change(screen.getByPlaceholderText('Email'), {
    target: { value: 'test@example.com' }
  });
  fireEvent.change(screen.getByPlaceholderText('Kata Sandi'), {
    target: { value: 'wrongpassword' }
  });
  
  fireEvent.click(screen.getByText('Masuk Sekarang'));
  
  const errorAlert = await screen.findByRole('alert');
  expect(errorAlert).toBeInTheDocument();
});
```

---

## 📚 Related Documentation

- [Backend Auth API](../../../app/Http/Controllers/Api/V1/Auth/)
- [Route Guards](../components/RouteGuards.tsx)
- [API Configuration](../api/)

---

**Last Updated:** 2026-03-15
**Author:** Agent 6 (QA & Integration)
