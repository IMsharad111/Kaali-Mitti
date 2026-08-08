import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import CartSidebar from './components/CartSidebar'
import Home from './pages/Home'
import ProductDetail from './pages/ProductDetail'
import Checkout from './pages/Checkout'
import Success from './pages/Success'
import Login from './pages/Login'
import Admin from './pages/Admin'
import { useAuth } from './context/AuthContext'

const ProtectedAdmin = ({ children }) => {
  const { user } = useAuth()
  if (!user || user.role !== 'admin') return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <>
      {!window.location.pathname.startsWith('/admin') && <Navbar />}
      {!window.location.pathname.startsWith('/admin') && <CartSidebar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/product/:slug" element={<ProductDetail />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/success" element={<Success />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<ProtectedAdmin><Admin /></ProtectedAdmin>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
