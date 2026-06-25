import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const { login, register } = useAuth()

  const [tab, setTab] = useState('buyer')       // 'buyer' | 'admin' | 'register'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Buyer login
  const [buyerEmail, setBuyerEmail] = useState('')
  const [buyerPass, setBuyerPass] = useState('')

  // Admin login
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPass, setAdminPass] = useState('')

  // Register
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPass, setRegPass] = useState('')

  const handleBuyerLogin = async () => {
    setError(''); setLoading(true)
    try {
      await login(buyerEmail, buyerPass)
      navigate('/')
    } catch (e) { setError(e.response?.data?.message || 'Login failed') }
    finally { setLoading(false) }
  }

  const handleAdminLogin = async () => {
    setError(''); setLoading(true)
    try {
      const user = await login(adminEmail, adminPass)
      if (user.role !== 'admin') { setError('Not an admin account'); return }
      navigate('/admin')
    } catch (e) { setError(e.response?.data?.message || 'Login failed') }
    finally { setLoading(false) }
  }

  const handleRegister = async () => {
    setError(''); setLoading(true)
    try {
      await register(regName, regEmail, regPass)
      navigate('/')
    } catch (e) { setError(e.response?.data?.message || 'Registration failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="auth-page">
      {/* Left panel */}
      <div className="auth-left">
        <span className="logo">KAALIMITTI</span>
        <p className="auth-tagline">"Pure Earth,<br />Pure Beauty,<br />Pure You."</p>
        <div className="auth-deco"><div className="auth-deco-inner" /></div>
      </div>

      {/* Right panel */}
      <div className="auth-right">
        <button className="btn btn-ghost" style={{ fontSize: 12, marginBottom: 40, padding: '8px 14px', width: 'fit-content' }} onClick={() => navigate('/')}>
          ← Back to Shop
        </button>

        <div className="auth-tabs">
          <button className={`auth-tab ${tab === 'buyer' ? 'active' : ''}`} onClick={() => { setTab('buyer'); setError('') }}>Buyer Login</button>
          <button className={`auth-tab ${tab === 'admin' ? 'active' : ''}`} onClick={() => { setTab('admin'); setError('') }}>Admin Login</button>
        </div>

        {error && <p style={{ color: 'crimson', fontSize: 13, marginBottom: 12 }}>{error}</p>}

        {/* Buyer Login */}
        {tab === 'buyer' && (
          <div className="auth-form">
            <h2>Welcome Back</h2>
            <p>Sign in to track orders, manage wishlist &amp; more.</p>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="field-label">Email</label>
              <input type="email" placeholder="you@email.com" value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 8 }}>
              <label className="field-label">Password</label>
              <input type="password" placeholder="••••••••" value={buyerPass} onChange={(e) => setBuyerPass(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleBuyerLogin()} />
            </div>
            <a className="forgot-link">Forgot password?</a>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 24, padding: 13 }} onClick={handleBuyerLogin} disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
            <div className="auth-divider">or</div>
            <p style={{ fontSize: 13, color: 'var(--text-mid)', textAlign: 'center' }}>
              Don't have an account? <a style={{ color: 'var(--clay-warm)', cursor: 'pointer' }} onClick={() => setTab('register')}>Create one →</a>
            </p>
          </div>
        )}

        {/* Admin Login */}
        {tab === 'admin' && (
          <div className="auth-form">
            <h2>Admin Access</h2>
            <p>Manage products, orders, content &amp; certifications.</p>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="field-label">Admin Email</label>
              <input type="email" placeholder="admin@kaalimitti.in" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 8 }}>
              <label className="field-label">Admin Password</label>
              <input type="password" placeholder="••••••••" value={adminPass} onChange={(e) => setAdminPass(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()} />
            </div>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 24, padding: 13 }} onClick={handleAdminLogin} disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In as Admin'}
            </button>
            <p style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 16, textAlign: 'center' }}>
              Default: admin@kaalimitti.in / admin123
            </p>
          </div>
        )}

        {/* Register */}
        {tab === 'register' && (
          <div className="auth-form">
            <h2>Create Account</h2>
            <p>Join Kaalimitti for exclusive offers and order tracking.</p>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="field-label">Full Name</label>
              <input type="text" placeholder="Rahul Sharma" value={regName} onChange={(e) => setRegName(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="field-label">Email</label>
              <input type="email" placeholder="you@email.com" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 8 }}>
              <label className="field-label">Password</label>
              <input type="password" placeholder="Min 6 characters" value={regPass} onChange={(e) => setRegPass(e.target.value)} />
            </div>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 24, padding: 13 }} onClick={handleRegister} disabled={loading}>
              {loading ? 'Creating…' : 'Create Account'}
            </button>
            <div className="auth-divider">or</div>
            <p style={{ fontSize: 13, color: 'var(--text-mid)', textAlign: 'center' }}>
              Already have an account? <a style={{ color: 'var(--clay-warm)', cursor: 'pointer' }} onClick={() => setTab('buyer')}>Sign in →</a>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
