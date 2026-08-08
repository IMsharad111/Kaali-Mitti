import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useCart } from '../context/CartContext'

export default function ProductDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { addToCart, setIsOpen } = useCart()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [qty, setQty] = useState(1)
  const [variant, setVariant] = useState('')
  const [activeImg, setActiveImg] = useState(0)
  const [toastMsg, setToastMsg] = useState('')
  const [toastVisible, setToastVisible] = useState(false)

  useEffect(() => {
    setLoading(true)
    api.get(`/products/${slug}`)
      .then((r) => { setProduct(r.data); setVariant(r.data.variants?.[0]?.label || '') })
      .catch(() => navigate('/'))
      .finally(() => setLoading(false))
  }, [slug])

  const showToast = (msg) => {
    setToastMsg(msg); setToastVisible(true)
    setTimeout(() => setToastVisible(false), 2500)
  }

  const handleAddToCart = () => {
    if (!product) return
    addToCart(product, variant, qty)
    showToast(`${product.name} added to cart!`)
    setIsOpen(true)
  }

  const discount = product ? Math.round((1 - product.price / product.originalPrice) * 100) : 0

  if (loading) return <div className="loading"><div className="spinner" />Loading product…</div>
  if (!product) return null

  return (
    <>
      <div className="product-detail">
        <button className="back-btn" onClick={() => navigate('/')}>← Back to Shop</button>
        <div className="detail-grid">

          {/* Images */}
          <div className="detail-imgs">
            <div className="detail-main-img">
              {product.images?.[activeImg]
                ? <img src={product.images[activeImg]} alt={product.name} />
                : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, color: 'var(--text-light)' }}>
                    <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
                      <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="12" cy="15" r="2" /><path d="M3 9l4-4 4 4 4-4 4 4" />
                    </svg>
                    <span style={{ fontSize: 13, letterSpacing: 1 }}>Upload product image via Admin</span>
                  </div>
                )
              }
            </div>
            <div className="detail-thumbs">
              {product.images?.length > 0
                ? product.images.map((img, i) => (
                  <div key={i} className={`thumb ${activeImg === i ? 'active' : ''}`} onClick={() => setActiveImg(i)}>
                    <img src={img} alt="" />
                  </div>
                ))
                : ['Front', 'Side', 'Back', 'Use'].map((label, i) => (
                  <div key={i} className={`thumb ${activeImg === i ? 'active' : ''}`} onClick={() => setActiveImg(i)}>{label}</div>
                ))
              }
            </div>
          </div>

          {/* Info */}
          <div className="detail-info">
            <h1 className="product-name">{product.name}</h1>
            <div className="detail-rating">
              <span className="stars">{'★'.repeat(Math.round(product.rating))}{'☆'.repeat(5 - Math.round(product.rating))}</span>
              <span>{product.rating} ({product.reviewCount} reviews)</span>
            </div>
            <div className="detail-price">
              ₹{product.price}
              {product.originalPrice > product.price && <span className="original">₹{product.originalPrice}</span>}
              {discount > 0 && <span className="badge">{discount}% OFF</span>}
            </div>
            <p className="detail-desc">{product.description}</p>

            <div className="variant-label">Size</div>
            <div className="variants">
              {(product.variants?.length ? product.variants : [{ label: '100g' }, { label: '200g' }, { label: '500g' }]).map((v) => (
                <button key={v.label} className={`variant-btn ${variant === v.label ? 'active' : ''}`} onClick={() => setVariant(v.label)}>
                  {v.label}
                </button>
              ))}
            </div>

            <div className="variant-label">Quantity</div>
            <div className="qty-selector">
              <button className="qty-btn" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
              <div className="qty-num">{qty}</div>
              <button className="qty-btn" onClick={() => setQty((q) => q + 1)}>+</button>
            </div>

            <div className="action-row">
  {product.stock === 0 ? (
    <button className="btn btn-primary" disabled style={{opacity:0.5, cursor:"not-allowed"}}>Out of Stock</button>
  ) : (
    <>
      <button className="btn btn-primary" onClick={handleAddToCart}>Add to Cart</button>
      <button className="btn btn-outline" onClick={() => { handleAddToCart(); navigate('/checkout') }}>Buy Now →</button>
    </>
  )}
</div>

            <div className="detail-features">
              {(product.features?.length ? product.features : [
                '100% natural Kaali Mitti (Black Clay)',
                'No parabens, sulphates, or artificial fragrances',
                'Dermatologist tested & verified',
                'Free delivery on orders above ₹399',
                'Easy 7-day returns',
              ]).map((f) => (
                <div className="feature-item" key={f}><div className="feature-dot" />{f}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className={`toast ${toastVisible ? 'show' : ''}`}>{toastMsg}</div>
    </>
  )
}
