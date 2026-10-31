import { Navigate, Route, Routes } from 'react-router'
import { RequireAuth } from './auth/RequireAuth'
import { AdminLayout } from './components/AdminLayout'
import { LoginPage } from './pages/LoginPage'
import { OrdersPage } from './pages/OrdersPage'
import { ProductsPage } from './pages/ProductsPage'
import { PublicShopPage } from './pages/PublicShopPage'
import { RegisterPage } from './pages/RegisterPage'

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/cadastro" element={<RegisterPage />} />
      <Route path="/loja/:slug" element={<PublicShopPage />} />
      <Route element={<RequireAuth />}>
        <Route path="/painel" element={<AdminLayout />}>
          <Route index element={<Navigate to="produtos" replace />} />
          <Route path="produtos" element={<ProductsPage />} />
          <Route path="pedidos" element={<OrdersPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/painel" replace />} />
    </Routes>
  )
}
