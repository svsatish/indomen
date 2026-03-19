import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';
import { SettingsProvider } from './context/SettingsContext';
import { CacheProvider } from './context/CacheContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Header from './components/Header';
import SiteBanner from './components/SiteBanner';
import NotificationBanner from './components/NotificationBanner';
import Toast from './components/Toast';

// Pages
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';
import Orders from './pages/Orders';
import Login from './pages/Login';
import PayBalance from './pages/PayBalance';

// Admin Pages
import Dashboard from './pages/admin/Dashboard';
import ProductManagement from './pages/admin/ProductManagement';
import OrderManagement from './pages/admin/OrderManagement';
import UserManagement from './pages/admin/UserManagement';
import AuditLog from './pages/admin/AuditLog';
import Settings from './pages/admin/Settings';
import Analytics from './pages/admin/Analytics';
import AccountBalances from './pages/admin/AccountBalances';

// Kiosk Pages
import KioskDashboard from './pages/kiosk/KioskDashboard';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <SettingsProvider>
          <CacheProvider>
            <AuthProvider>
              <CartProvider>
                <div className="app">
                  <Toast />
                  <SiteBanner />
                  <NotificationBanner />
                  <Header />
                  <main>
                    <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />

                    {/* Protected Product Routes - Require Login */}
                    <Route
                      path="/products"
                      element={
                        <ProtectedRoute>
                          <Products />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/product/:id"
                      element={
                        <ProtectedRoute>
                          <ProductDetail />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/cart"
                      element={
                        <ProtectedRoute>
                          <Cart />
                        </ProtectedRoute>
                      }
                    />

                    {/* Protected Routes */}
                    <Route
                      path="/checkout"
                      element={
                        <ProtectedRoute>
                          <Checkout />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/order-confirmation"
                      element={
                        <ProtectedRoute>
                          <OrderConfirmation />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/orders"
                      element={
                        <ProtectedRoute>
                          <Orders />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/pay-balance"
                      element={
                        <ProtectedRoute>
                          <PayBalance />
                        </ProtectedRoute>
                      }
                    />

                    {/* Kiosk Route - Accessible by admin and kiosk users */}
                    <Route
                      path="/kiosk"
                      element={
                        <ProtectedRoute kioskOrAdmin>
                          <KioskDashboard />
                        </ProtectedRoute>
                      }
                    />

                    {/* Admin Routes */}
                    <Route
                      path="/admin"
                      element={
                        <ProtectedRoute adminOnly>
                          <Dashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/products"
                      element={
                        <ProtectedRoute adminOnly>
                          <ProductManagement />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/orders"
                      element={
                        <ProtectedRoute adminOnly>
                          <OrderManagement />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/users"
                      element={
                        <ProtectedRoute adminOnly>
                          <UserManagement />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/audit-log"
                      element={
                        <ProtectedRoute adminOnly>
                          <AuditLog />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/settings"
                      element={
                        <ProtectedRoute adminOnly>
                          <Settings />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/analytics"
                      element={
                        <ProtectedRoute adminOnly>
                          <Analytics />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/account-balances"
                      element={
                        <ProtectedRoute adminOnly>
                          <AccountBalances />
                        </ProtectedRoute>
                      }
                    />
                  </Routes>
                </main>
              </div>
            </CartProvider>
          </AuthProvider>
        </CacheProvider>
      </SettingsProvider>
    </ThemeProvider>
  </BrowserRouter>
);
}

export default App;
