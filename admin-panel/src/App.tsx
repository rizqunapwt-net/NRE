import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Auth & Context
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Components
import PageLoader from './components/PageLoader';
import MainLayout from './components/MainLayout';
import { AuthGuard, AuthorGuard } from './components/RouteGuards';

// Eager loaded auth pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import AuthorRegisterPage from './pages/auth/AuthorRegisterPage';
import GoogleCallbackPage from './pages/auth/GoogleCallbackPage';

// Lazy loaded pages
const ChangePasswordPage = React.lazy(() => import('./pages/auth/ChangePasswordPage'));
const ForgotPasswordPage = React.lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = React.lazy(() => import('./pages/auth/ResetPasswordPage'));
const VerifyEmailPage = React.lazy(() => import('./pages/auth/VerifyEmailPage'));
const ProfilePage = React.lazy(() => import('./pages/auth/ProfilePage'));
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage'));

// Landing & Public
const LandingPage = React.lazy(() => import('./pages/landing/LandingPage'));
const ContactPage = React.lazy(() => import('./pages/landing/ContactPage'));
const PublicLayout = React.lazy(() => import('./pages/landing/PublicLayout'));
const EbookCatalogPage = React.lazy(() => import('./pages/catalog/EbookCatalogPage'));
const BookDetailPage = React.lazy(() => import('./pages/landing/BookDetailPage'));
const PdfReaderPage = React.lazy(() => import('./pages/landing/PdfReaderPage'));
const RepositoryPage = React.lazy(() => import('./pages/landing/RepositoryPage'));
const RepositoryDetailPage = React.lazy(() => import('./pages/landing/RepositoryDetailPage'));

// Author Portal
const PenulisLayout = React.lazy(() => import('./pages/penulis/PenulisLayout'));
const CreateBookWizard = React.lazy(() => import('./pages/penulis/naskah/CreateBookWizard'));

// Admin
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const UserManagementPage = React.lazy(() => import('./pages/admin/UserManagementPage'));
const AuthorAccountPage = React.lazy(() => import('./pages/admin/AuthorAccountPage'));

// NRE Publishing
const ManajemenBukuPage = React.lazy(() => import('./pages/nre/ManajemenBukuPage'));
const NaskahPenerbitanPage = React.lazy(() => import('./pages/nre/NaskahPenerbitanPage'));
const NaskahCetakPage = React.lazy(() => import('./pages/nre/NaskahCetakPage'));
const ProsesISBNPage = React.lazy(() => import('./pages/nre/ProsesISBNPage'));
const LegalDepositPage = React.lazy(() => import('./pages/nre/LegalDepositPage'));
const PenulisPage = React.lazy(() => import('./pages/nre/PenulisPage'));
const KontrakPage = React.lazy(() => import('./pages/nre/KontrakPage'));
const PenjualanBukuPage = React.lazy(() => import('./pages/nre/PenjualanBukuPage'));
const OrderCetakPage = React.lazy(() => import('./pages/nre/OrderCetakPage'));
const RoyaltyCalculationPage = React.lazy(() => import('./pages/nre/RoyaltyCalculationPage'));

// Website CMS
const KelolaHero = React.lazy(() => import('./pages/admin/website/KelolaHero'));
const KelolaLayanan = React.lazy(() => import('./pages/admin/website/KelolaLayanan'));
const KelolaBanner = React.lazy(() => import('./pages/admin/website/KelolaBanner'));
const KelolaFooter = React.lazy(() => import('./pages/admin/website/KelolaFooter'));
const KelolaMarketplace = React.lazy(() => import('./pages/admin/website/KelolaMarketplace'));
const KelolaFaq = React.lazy(() => import('./pages/admin/website/KelolaFaq'));
const KelolaTestimoni = React.lazy(() => import('./pages/admin/website/KelolaTestimoni'));
const KelolaBlog = React.lazy(() => import('./pages/admin/website/KelolaBlog'));

// Percetakan
const OrderEntryPage = React.lazy(() => import('./pages/percetakan/OrderEntryPage'));
const OrderListPage = React.lazy(() => import('./pages/percetakan/OrderListPage'));
const OrderDetailPage = React.lazy(() => import('./pages/percetakan/OrderDetailPage'));
const ProductionDashboardPage = React.lazy(() => import('./pages/percetakan/ProductionDashboardPage'));
const CalculatorPage = React.lazy(() => import('./pages/percetakan/CalculatorPage'));
const MachinesPage = React.lazy(() => import('./pages/percetakan/MachinesPage'));

// Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

import { designTokens } from './theme/designTokens';

// ... (previous imports)

const App: React.FC = () => {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: designTokens.colors.primary[500],
          colorLink: designTokens.colors.primary[500],
          colorLinkHover: designTokens.colors.primary[600],
          colorInfo: designTokens.colors.primary[500],
          colorSuccess: designTokens.colors.success.main,
          colorWarning: designTokens.colors.warning.main,
          colorError: designTokens.colors.error.main,
          colorText: designTokens.colors.gray[800],
          colorTextSecondary: designTokens.colors.gray[500],
          fontFamily: designTokens.typography.fontFamily.primary,
          borderRadius: parseInt(designTokens.borderRadius.md.replace('px', ''), 10),
        },
        components: {
          Button: {
            colorPrimary: designTokens.colors.primary[500],
            borderRadius: parseInt(designTokens.borderRadius.md.replace('px', ''), 10),
          },
          Card: {
            borderRadiusLG: parseInt(designTokens.borderRadius.lg.replace('px', ''), 10),
          },
          Menu: {
            itemSelectedBg: designTokens.colors.primary[50],
            itemSelectedColor: designTokens.colors.primary[500],
            itemActiveBg: designTokens.colors.primary[50],
          },
          Tabs: {
            inkBarColor: designTokens.colors.primary[500],
            itemSelectedColor: designTokens.colors.primary[500],
            itemHoverColor: designTokens.colors.primary[600],
          },
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <Router>
          <ThemeProvider>
            <AuthProvider>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* PUBLIC ROUTES — all wrapped in PublicLayout (shared Navbar + Footer) */}
                  <Route element={<PublicLayout />}>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/katalog" element={<EbookCatalogPage />} />
                    <Route path="/katalog/:slug" element={<BookDetailPage />} />
                    <Route path="/ebooks" element={<EbookCatalogPage />} />
                    <Route path="/ebooks/:slug" element={<BookDetailPage />} />
                    <Route path="/catalog" element={<EbookCatalogPage />} />
                    <Route path="/repository" element={<RepositoryPage />} />
                    <Route path="/repository/:slug" element={<RepositoryDetailPage />} />
                  </Route>
                  <Route path="/katalog/:slug/baca" element={<PdfReaderPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/author-register" element={<AuthorRegisterPage />} />
                  <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />
                  <Route path="/lupa-password" element={<ForgotPasswordPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route path="/verify-email" element={<VerifyEmailPage />} />
                  <Route path="/ganti-password" element={<AuthGuard><ChangePasswordPage /></AuthGuard>} />

                  {/* AUTHOR PORTAL */}
                  <Route path="/penulis/kirim-naskah" element={<AuthorGuard><CreateBookWizard /></AuthorGuard>} />
                  <Route path="/penulis/*" element={<AuthorGuard><PenulisLayout /></AuthorGuard>} />

                  {/* PROTECTED ROUTES */}
                  <Route path="/*" element={
                    <AuthGuard>
                      <MainLayout>
                        <Routes>
                          <Route path="/dashboard" element={<DashboardPage />} />
                          <Route path="/" element={<Navigate to="/dashboard" replace />} />

                          {/* Settings & Profile */}
                          <Route path="/settings/users" element={<UserManagementPage />} />
                          <Route path="/profile" element={<ProfilePage />} />

                          {/* Admin */}
                          <Route path="/kelola-akun-penulis" element={<AuthorAccountPage />} />

                          {/* NRE Publishing */}
                          <Route path="/books" element={<ManajemenBukuPage />} />
                          <Route path="/publishing/manuscripts" element={<NaskahPenerbitanPage />} />
                          <Route path="/publishing/authors" element={<PenulisPage />} />
                          <Route path="/publishing/contracts" element={<KontrakPage />} />
                          <Route path="/publishing/isbn" element={<ProsesISBNPage />} />
                          <Route path="/publishing/legal-deposit" element={<LegalDepositPage />} />
                          <Route path="/publishing/sales" element={<PenjualanBukuPage />} />
                          <Route path="/publishing/royalties" element={<RoyaltyCalculationPage />} />
                          <Route path="/printing/manuscripts" element={<NaskahCetakPage />} />
                          <Route path="/printing/orders" element={<OrderCetakPage />} />

                          {/* Percetakan */}
                          <Route path="/percetakan/orders" element={<OrderListPage />} />
                          <Route path="/percetakan/orders/new" element={<OrderEntryPage />} />
                          <Route path="/percetakan/orders/:id" element={<OrderDetailPage />} />
                          <Route path="/percetakan/production" element={<ProductionDashboardPage />} />
                          <Route path="/percetakan/calculator" element={<CalculatorPage />} />
                          <Route path="/percetakan/machines" element={<MachinesPage />} />

                          {/* Website CMS */}
                          <Route path="/website/hero" element={<KelolaHero />} />
                          <Route path="/website/layanan" element={<KelolaLayanan />} />
                          <Route path="/website/banner" element={<KelolaBanner />} />
                          <Route path="/website/footer" element={<KelolaFooter />} />
                          <Route path="/website/marketplace" element={<KelolaMarketplace />} />
                          <Route path="/website/faq" element={<KelolaFaq />} />
                          <Route path="/website/testimoni" element={<KelolaTestimoni />} />
                          <Route path="/website/blog" element={<KelolaBlog />} />

                          {/* 404 */}
                          <Route path="*" element={<NotFoundPage />} />
                        </Routes>
                      </MainLayout>
                    </AuthGuard>
                  } />
                </Routes>
              </Suspense>
            </AuthProvider>
          </ThemeProvider>
        </Router>
      </QueryClientProvider>
    </ConfigProvider>
  );
};

export default App;
