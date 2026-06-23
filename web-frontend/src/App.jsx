// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';

import LoginPage         from './pages/LoginPage';
import DashboardPage     from './pages/DashboardPage';
import ProductsPage      from './pages/ProductsPage';
import SalesPage         from './pages/SalesPage';
import CheckoutPage      from './pages/CheckoutPage';
import ReportsPage       from './pages/ReportsPage';
import UsersPage         from './pages/UsersPage';
import ReceiptPage       from './pages/ReceiptPage';
import AppLayout         from './components/layout/AppLayout';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  if (requiredRole && user?.role !== requiredRole && !['ADMIN'].includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route path="/" element={
            <ProtectedRoute><AppLayout /></ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard"  element={<DashboardPage />} />
            <Route path="products"   element={<ProductsPage />} />
            <Route path="sales"      element={<SalesPage />} />
            <Route path="checkout"   element={<CheckoutPage />} />
            <Route path="receipt/:receiptNumber" element={<ReceiptPage />} />
            <Route path="reports"    element={
              <ProtectedRoute requiredRole="MANAGER"><ReportsPage /></ProtectedRoute>
            } />
            <Route path="users"      element={
              <ProtectedRoute requiredRole="ADMIN"><UsersPage /></ProtectedRoute>
            } />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" toastOptions={{
        duration: 4000,
        style: { background: '#1e293b', color: '#f1f5f9', fontSize: '14px' }
      }} />
    </QueryClientProvider>
  );
}
