import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/common/Navbar'
import SubscriptionBanner from './components/subscription/SubscriptionBanner'
import ProtectedRoute from './components/auth/ProtectedRoute'
import AdminRoute from './components/auth/AdminRoute'
import LoadingSpinner from './components/common/LoadingSpinner'
import LoginPage from './pages/LoginPage'
import CatalogPage from './pages/CatalogPage'
import PieceDetailPage from './pages/PieceDetailPage'
import PricingPage from './pages/PricingPage'
import ProfilePage from './pages/ProfilePage'
import AdminCatalogPage from './pages/admin/AdminCatalogPage'
import CatalogFormPage from './pages/admin/CatalogFormPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'

function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <SubscriptionBanner />
      <Outlet />
    </div>
  )
}

function HomeRedirect() {
  const { user, isLoading } = useAuth()
  if (isLoading) return <LoadingSpinner className="min-h-screen" />
  return user ? <Navigate to="/catalog" replace /> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<Layout />}>
              <Route path="/" element={<HomeRedirect />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route
                path="/catalog"
                element={<ProtectedRoute><CatalogPage /></ProtectedRoute>}
              />
              <Route
                path="/catalog/:id"
                element={<ProtectedRoute><PieceDetailPage /></ProtectedRoute>}
              />
              <Route
                path="/profile"
                element={<ProtectedRoute><ProfilePage /></ProtectedRoute>}
              />
              <Route
                path="/admin/catalog"
                element={<AdminRoute><AdminCatalogPage /></AdminRoute>}
              />
              <Route
                path="/admin/catalog/new"
                element={<AdminRoute><CatalogFormPage /></AdminRoute>}
              />
              <Route
                path="/admin/catalog/:id/edit"
                element={<AdminRoute><CatalogFormPage /></AdminRoute>}
              />
              <Route
                path="/admin/users"
                element={<AdminRoute><AdminUsersPage /></AdminRoute>}
              />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </GoogleOAuthProvider>
  )
}
