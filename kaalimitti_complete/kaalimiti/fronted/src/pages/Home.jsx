import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useCart } from '../context/CartContext'
import Footer from '../components/Footer'

export default function Home() {
  const navigate = useNavigate()
  const { addToCart, setIsOpen } = useCart()
  const [products, setProducts] = useState([])
  const [toastMsg, setToastMsg] = useState('')
  const [toastVisible, setToastVisible] = useState(false)

  useEffect(() => {
    api.get('/products').then((r) => setProducts(r.data)).catch(() => {})
  }, [])

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  const handleAddToCart = (product) => {
    if (!product) return
    addToCart(product, product.variants?.[0]?.label || '')
    showToast(`${product.name} added to cart!`)
    setIsOpen(true)
  }

  const showToast = (msg) => {
    setToastMsg(msg)
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 2500)
  }

  const getProduct = (slug) => products.find((p) => p.slug === slug)

  return (
    <>
      {/* ── HERO ── */}
      <section className="hero" id="home">
        <div className="hero-left">
          <div className="hero-badge">
            <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor"><circle cx="4" cy="4" r="4" /></svg>
            100% Natural • Ayurvedic • Earth-Born
          </div>
          <h1>Pure Earth.<br /><em>Pure Glow.</em></h1>
          <p className="hero-sub">Harnessing the ancient power of Kaali Mitti — black clay harvested from mineral-rich Indian soil — for your skin, scalp, and hair.</p>
          <div className="hero-cta">
            <button className="btn btn-primary" onClick={() => scrollTo('products-sec')}>Shop Now →</button>
            <button className="btn btn-outline" onClick={() => scrollTo('ingredients-sec')}>Our Story</button>
          </div>
          <div className="hero-scroll">
            <div className="scroll-line" />
            Scroll to explore
          </div>
        </div>
        <div className="hero-right">
          <div className="hero-bg-pattern" />
          <div className="hero-img-grid">
            {['Face Pack', 'Shampoo', 'Pure Clay', 'Natural'].map((label, i) => (
              <div className="hero-img-cell" key={i}>
                <div className="img-placeholder">
                  <svg width="32" height="32" fill="none" stroke="#A0522D" strokeWidth="1" viewBox="0 0 24 24">
                    <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9l4-4 4 4 4-4 4 4" />
                  </svg>
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRODUCTS ── */}
      <section className="section" id="products-sec">
        <div className="section-label">Our Products</div>
        <h2 className="section-title">Ancient Clay,<br />Modern Ritual</h2>
        <p className="section-sub">Two powerful formulations crafted from authentic Kaali Mitti, bringing centuries of Ayurvedic wisdom to your daily routine.</p>
        <div className="products-grid">
          {[
            { slug: 'facepack', badge: 'Bestseller', fallbackName: 'Kaali Mitti Face Pack', fallbackPrice: 349, fallbackOrig: 499, fallbackDesc: 'Deep-cleansing black clay face pack that draws out impurities, tightens pores, and leaves skin radiant.' },
            { slug: 'shampoo', badge: 'New', fallbackName: 'Kaali Mitti Shampoo', fallbackPrice: 299, fallbackOrig: 449, fallbackDesc: 'Mineral-rich clay shampoo that cleanses the scalp deeply, reduces dandruff and strengthens roots without sulphates.' },
          ].map(({ slug, badge, fallbackName, fallbackPrice, fallbackOrig, fallbackDesc }) => {
            const p = getProduct(slug)
            const name = p?.name || fallbackName
            const price = p?.price || fallbackPrice
            const orig = p?.originalPrice || fallbackOrig
            const desc = p?.description || fallbackDesc
            return (
              <div className="product-card" key={slug} onClick={() => navigate(`/product/${slug}`)}>
                <div className="product-img">
                  {p?.images?.[0]
                    ? <img src={p.images[0]} alt={name} />
                    : <div className="product-img-placeholder"><div className="prod-icon"><svg width="36" height="36" fill="none" stroke="#fff" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="8" r="5" /><path d="M3 21v-1a9 9 0 0118 0v1" /></svg></div><p style={{ fontFamily: 'Cormorant Garamond,serif', fontSize: 14, color: 'var(--text-mid)', letterSpacing: 1, textAlign: 'center' }}>Upload product image<br />via Admin panel</p></div>
                  }
                  <div className="product-badge">{p?.badge || badge}</div>
                  <div className="product-tap-hint">
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 3h6v6M10 14L21 3M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /></svg>
                    View &amp; Buy
                  </div>
                </div>
                <div className="product-info">
                  <h3 className="product-name">{name}</h3>
                  <p className="product-desc">{desc}</p>
                  <div className="product-meta">
                    <div className="product-price">₹{price} <span>₹{orig}</span></div>
                    <button className="btn btn-primary" onClick={(e) => { e.stopPropagation(); handleAddToCart(p || { _id: slug, name, price, images: [], variants: [{ label: '100g' }], slug }) }}>
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── INGREDIENTS ── */}
      <section className="ingredients-section" id="ingredients-sec">
        <div className="section-label">What is Kaali Mitti</div>
        <h2 className="section-title" style={{ color: 'var(--cream)' }}>Earth's Ancient<br />Beauty Secret</h2>
        <p className="section-sub" style={{ color: 'rgba(250,246,240,0.65)' }}>Kaali Mitti, or Black Clay, has been treasured in Ayurvedic tradition for over 3,000 years. Harvested from mineral-rich Indian riverbeds and forests, it carries within it the concentrated wisdom of the earth.</p>

        <div className="info-grid">
          {[
            { icon: '⚗️', title: 'Rich Mineral Content', text: 'Packed with silica, calcium, magnesium, potassium, and iron. These minerals nourish skin cells, support collagen production, and restore the skin\'s natural pH balance.' },
            { icon: '🌿', title: 'Ayurvedic Heritage', text: 'Referenced in ancient Charaka Samhita texts, Kaali Mitti has been used in Panchakarma and beauty rituals for centuries across India for its purifying and healing properties.' },
            { icon: '✨', title: 'Zero Additives', text: 'Our clay is sun-dried, hand-processed, and never exposed to chemicals. What you get is exactly what the earth provides — nothing added, nothing removed.' },
            { icon: '🌍', title: 'Ethically Sourced', text: 'Collected from designated natural deposits using sustainable practices that preserve the ecology. Every purchase supports local communities and responsible harvesting.' },
          ].map(({ icon, title, text }) => (
            <div className="info-card" key={title}>
              <div className="info-icon">{icon}</div>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>

        <div className="history-block">
          <div className="history-text">
            <h2>3,000 Years of Wisdom, Brought to You</h2>
            <p>In ancient India, women would trek to riverbeds to collect black clay for their weekly beauty rituals. Grandmothers passed the knowledge of clay masks to daughters — how to mix it with rose water, turmeric, or neem for different skin needs.</p>
            <p>Kaali Mitti's unique negative charge acts like a magnet, drawing out positively charged toxins, bacteria, and excess oils from deep within pores. No synthetic product can replicate this natural ionic action.</p>
            <p>We've revived this ancient tradition, combining age-old wisdom with careful, modern formulation to bring you products that actually work — gently and powerfully.</p>
          </div>
          <div className="history-img">
            <span className="history-img-placeholder">📸 Historical image — upload via Admin</span>
          </div>
        </div>

        <div className="skin-benefits">
          {[
            { num: '98%', label: 'Pore Minimising', desc: 'Users report visibly tighter pores after 4 weeks of regular use' },
            { num: '3x', label: 'Deeper Cleanse', desc: 'Penetrates 3x deeper than regular face washes to remove toxins' },
            { num: '0', label: 'Harsh Chemicals', desc: 'No parabens, sulphates, artificial fragrances, or synthetic dyes' },
          ].map(({ num, label, desc }) => (
            <div className="benefit-item" key={label}>
              <div className="benefit-num">{num}</div>
              <div className="benefit-label">{label}</div>
              <div className="benefit-desc">{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PROCESS ── */}
      <section className="process-section" id="process-sec">
        <div className="section-label">How We Make It</div>
        <h2 className="section-title">From Earth<br />to Your Hands</h2>
        <p className="section-sub">Every step of our process is intentional — preserving the clay's natural properties while ensuring purity and quality at each stage.</p>
        <div className="process-grid">
          {[
            { num: '01', title: 'Ethical Harvesting', text: 'Kaali Mitti is hand-collected from mineral-rich riverbed deposits during specific seasons when clay potency is highest. Only the deepest, purest layers are selected.' },
            { num: '02', title: 'Sun Drying', text: 'Collected clay is spread on clean stone surfaces and sun-dried for 7–10 days. This natural process removes moisture while preserving all mineral content and ionic properties.' },
            { num: '03', title: 'Purification & Testing', text: 'Dried clay is triple-sieved to remove impurities and tested for mineral content, pH levels, and microbial safety at certified laboratories before formulation.' },
            { num: '04', title: 'Formulation', text: 'Purified clay is blended with carefully chosen Ayurvedic herbs and plant extracts. Each batch is formulated fresh in small quantities for maximum potency.' },
          ].map(({ num, title, text }) => (
            <div className="process-step" key={num}>
              <div className="process-num">{num}</div>
              <div className="process-img">Upload process image via Admin</div>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
        <div className="video-section" onClick={() => showToast('Upload your process video via Admin Panel → Content → Videos')}>
          <div className="video-play">
            <svg width="28" height="28" fill="var(--cream)" viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21" /></svg>
          </div>
          <p style={{ color: 'rgba(250,246,240,0.7)', fontSize: 13, letterSpacing: 1 }}>Watch Our Making Process Video</p>
          <p style={{ fontSize: 11, color: 'rgba(250,246,240,0.4)' }}>Upload video via Admin Panel → Content → Videos</p>
        </div>
      </section>

      {/* ── CERTIFICATIONS ── */}
      <section className="cert-section" id="cert-sec">
        <div className="section-label">Trust & Quality</div>
        <h2 className="section-title" style={{ fontSize: 'clamp(28px,3vw,42px)' }}>Our Certifications</h2>
        <p style={{ fontSize: 14, color: 'var(--text-mid)', lineHeight: 1.7, marginTop: 8 }}>Certifications are uploaded and managed via the Admin Panel. Verified certificates build buyer trust — add yours today.</p>
        <div className="cert-grid">
          {[
            { icon: '🌿', title: 'Derma Verified', desc: 'Dermatologically tested and verified safe for all skin types including sensitive skin.' },
            { icon: '🌍', title: 'Soil Quality Certified', desc: 'Source clay tested and certified for mineral purity and absence of heavy metals or contaminants.' },
            { icon: '🏺', title: 'Ayurvedic Standard', desc: 'Formulation verified to conform to classical Ayurvedic preparation standards.' },
            { icon: '🔬', title: 'Lab Tested', desc: 'Third-party laboratory testing for safety, efficacy, and quality control on every batch.' },
          ].map(({ icon, title, desc }) => (
            <div className="cert-card" key={title}>
              <div className="cert-icon">{icon}</div>
              <h4>{title}</h4>
              <p>{desc}</p>
              <p className="cert-upload-note">Certificate pending upload</p>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 20, textAlign: 'center' }}>
          → Go to <strong style={{ cursor: 'pointer', color: 'var(--clay)' }} onClick={() => navigate('/admin')}>Admin Panel</strong> → Certifications to upload your certificates
        </p>
      </section>

      <Footer />
      <div className={`toast ${toastVisible ? 'show' : ''}`}>{toastMsg}</div>
    </>
  )
}
