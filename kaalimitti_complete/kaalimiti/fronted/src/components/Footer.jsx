import { useNavigate } from 'react-router-dom'

export default function Footer() {
  const navigate = useNavigate()
  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  return (
    <footer>
      <div className="footer-grid">
        <div className="footer-brand">
          <span className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>KAALIMITTI</span>
          <p>Pure earth beauty, rooted in Ayurvedic tradition. Bringing centuries of natural wisdom to your daily ritual.</p>
        </div>
        <div className="footer-col">
          <h5>Shop</h5>
          <a onClick={() => navigate('/product/facepack')}>Kaali Mitti Face Pack</a>
          <a onClick={() => navigate('/product/shampoo')}>Kaali Mitti Shampoo</a>
        </div>
        <div className="footer-col">
          <h5>Company</h5>
          <a onClick={() => { navigate('/'); setTimeout(() => scrollTo('ingredients-sec'), 100) }}>Our Ingredients</a>
          <a onClick={() => { navigate('/'); setTimeout(() => scrollTo('process-sec'), 100) }}>Our Process</a>
          <a onClick={() => { navigate('/'); setTimeout(() => scrollTo('cert-sec'), 100) }}>Certifications</a>
          <a onClick={() => navigate('/login')}>My Account</a>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2025 Kaalimitti.in — All rights reserved</span>
        <span>kaalimitti.in</span>
      </div>
    </footer>
  )
}
