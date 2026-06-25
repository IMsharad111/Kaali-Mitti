import { useNavigate, useLocation } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { count, setIsOpen } = useCart()
  const { user, logout } = useAuth()

  const scrollTo = (id) => {
    if (location.pathname !== '/') {
      navigate('/')
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 100)
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <nav>
      <div className="nav-inner">
        <span className="logo" onClick={() => navigate('/')}>KAALI<span>MITTI</span></span>
        <div className="nav-links">
          <a onClick={() => scrollTo('products-sec')}>Products</a>
          <a onClick={() => scrollTo('ingredients-sec')}>Ingredients</a>
          <a onClick={() => scrollTo('process-sec')}>Our Process</a>
          <a onClick={() => scrollTo('cert-sec')}>Certifications</a>
        </div>
        <div className="nav-actions">
          {user ? (
            <>
              {user.role === 'admin' && (
                <button className="btn btn-ghost" style={{ fontSize: '12px', padding: '8px 16px' }} onClick={() => navigate('/admin')}>
                  Admin
                </button>
              )}
              <button className="btn btn-ghost" style={{ fontSize: '12px', padding: '8px 16px' }} onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <button className="btn btn-ghost" style={{ fontSize: '12px', padding: '8px 16px' }} onClick={() => navigate('/login')}>
              Login
            </button>
          )}
          <button className="cart-btn" onClick={() => setIsOpen(true)}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
            {count > 0 && <span className="cart-count">{count}</span>}
          </button>
        </div>
      </div>
    </nav>
  )
}
