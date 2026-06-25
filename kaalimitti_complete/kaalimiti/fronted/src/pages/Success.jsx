import { useLocation, useNavigate } from 'react-router-dom'

export default function Success() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const orderId = state?.orderId || '#KM-00001'

  return (
    <div className="success-page">
      <div className="success-icon">
        <svg width="48" height="48" fill="none" stroke="var(--leaf)" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
          <polyline points="22,4 12,14.01 9,11.01" />
        </svg>
      </div>
      <h1>Order Placed!</h1>
      <p>Thank you for your order. We'll send a confirmation to your email. Your Kaalimitti products will be with you soon!</p>
      <div style={{ marginTop: 12, fontSize: 14, color: 'var(--text-light)' }}>
        Order ID: <strong style={{ color: 'var(--clay)' }}>{orderId}</strong>
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 40, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button className="btn btn-primary" onClick={() => navigate('/')}>Continue Shopping</button>
        <button className="btn btn-outline" onClick={() => navigate('/login')}>View My Orders</button>
      </div>
    </div>
  )
}
