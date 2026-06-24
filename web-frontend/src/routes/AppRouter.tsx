import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { CartProvider } from '@/context/CartContext'
import { AppLayout } from '@/components/layout/AppLayout'
import { RequireAuth, RequireManager, RedirectIfAuth } from './Guards'
import LoginPage    from '@/pages/LoginPage'
import SalePage     from '@/pages/SalePage'
import ProductsPage from '@/pages/ProductsPage'
import InventoryPage from '@/pages/InventoryPage'
import ReportsPage  from '@/pages/ReportsPage'
import UsersPage    from '@/pages/UsersPage'

export function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            {/* Public */}
            <Route element={<RedirectIfAuth/>}>
              <Route path="/login" element={<LoginPage/>}/>
            </Route>

            {/* Protected */}
            <Route element={<RequireAuth/>}>
              <Route element={<AppLayout/>}>
                <Route index element={<Navigate to="/sale" replace/>}/>
                <Route path="/sale"      element={<SalePage/>}/>
                <Route path="/products"  element={<ProductsPage/>}/>
                <Route path="/inventory" element={<InventoryPage/>}/>
                <Route path="/reports"   element={<ReportsPage/>}/>
                <Route element={<RequireManager/>}>
                  <Route path="/users" element={<UsersPage/>}/>
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/sale" replace/>}/>
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
