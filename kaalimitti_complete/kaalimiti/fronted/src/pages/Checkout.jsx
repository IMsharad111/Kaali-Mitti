import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

const STEPS = ['1. Address', '2. Payment', '3. Review']

const PAYMENT_OPTIONS = [
  { label: 'UPI / GPay / PhonePe', sub: 'Instant payment via any UPI app', razorpay: true },
  { label: 'Credit / Debit Card',   sub: 'Visa, Mastercard, RuPay',         razorpay: true },
  { label: 'Net Banking',           sub: 'All major Indian banks',           razorpay: true },
  { label: 'Cash on Delivery',      sub: 'Pay when order arrives',           razorpay: false },
]

// ── Load Razorpay script dynamically ──────────────────────────────────────
const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true)
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })

export default function Checkout() {
  const navigate = useNavigate()
  const { items, total, clearCart } = useCart()
  const { user } = useAuth()

  const [step, setStep] = useState(1)
  const [paymentIdx, setPaymentIdx] = useState(0)
  const [promo, setPromo] = useState('')
  const [discount, setDiscount] = useState(0)
  const [promoMsg, setPromoMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    firstName: '', lastName: '',
    email: user?.email || '', phone: '',
    line1: '', line2: '', city: '',
    state: 'Uttar Pradesh', pin: '',
  })

  const delivery  = total >= 399 ? 0 : 49
  const grandTotal = total + delivery - discount

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const applyPromo = () => {
    if (promo.toUpperCase() === 'KAALI10') {
      const d = Math.round(total * 0.1)
      setDiscount(d)
      setPromoMsg(`✓ KAALI10 applied — ₹${d} off!`)
    } else {
      setPromoMsg('✗ Invalid promo code')
    }
  }

  // ── Step 1 validation ────────────────────────────────────────────────────
  const validateAddress = () => {
    const required = ['firstName', 'lastName', 'email', 'phone', 'line1', 'city', 'state', 'pin']
    for (const k of required) {
      if (!form[k].trim()) { setError(`Please fill in ${k}`); return false }
    }
    if (!/^\d{6}$/.test(form.pin)) { setError('PIN code must be 6 digits'); return false }
    if (!/\S+@\S+\.\S+/.test(form.email)) { setError('Enter a valid email'); return false }
    setError(''); return true
  }

  // ── Place order ───────────────────────────────────────────────────────────
  const placeOrder = async () => {
    if (items.length === 0) return
    setLoading(true)
    setError('')

    const selectedPayment = PAYMENT_OPTIONS[paymentIdx]
    const orderPayload = {
      user: user?._id || null,
      guestName: `${form.firstName} ${form.lastName}`,
      guestEmail: form.email,
      items: items.map((i) => ({
        product: i.product._id,
        name: i.product.name,
        variant: i.variant,
        quantity: i.quantity,
        price: i.product.price,
        image: i.product.images?.[0] || '',
      })),
      address: {
        firstName: form.firstName, lastName: form.lastName,
        email: form.email, phone: form.phone,
        line1: form.line1, line2: form.line2,
        city: form.city, state: form.state, pin: form.pin,
      },
      paymentMethod: selectedPayment.label,
      subtotal: total,
      deliveryFee: delivery,
      discount,
      total: grandTotal,
    }

    try {
      // ── COD: place order directly ────────────────────────────────────────
      if (!selectedPayment.razorpay) {
        const { data } = await api.post('/orders', orderPayload)
        clearCart()
        navigate('/success', { state: { orderId: data.orderId } })
        return
      }

      // ── Online payment: open Razorpay ────────────────────────────────────
      const loaded = await loadRazorpay()
      if (!loaded) { setError('Failed to load payment gateway. Please try again.'); setLoading(false); return }

      // Create Razorpay order
      const { data: rpOrder } = await api.post('/payment/create-order', { amount: grandTotal })

      const options = {
        key: rpOrder.key,
        amount: rpOrder.amount,
        currency: rpOrder.currency,
        name: 'Kaalimitti',
        description: `Order of ${items.length} item(s)`,
        order_id: rpOrder.orderId,
        prefill: { name: `${form.firstName} ${form.lastName}`, email: form.email, contact: form.phone },
        theme: { color: '#a0522d' },
        handler: async (response) => {
          try {
            // Attach Razorpay payment proof to order payload and place order
            const { data } = await api.post('/orders', {
              ...orderPayload,
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
            })
            clearCart()
            navigate('/success', { state: { orderId: data.orderId } })
          } catch (err) {
            setError(err.response?.data?.message || 'Order creation failed after payment.')
            setLoading(false)
          }
        },
        modal: {
          ondismiss: () => { setError('Payment cancelled.'); setLoading(false) },
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', (resp) => {
        setError('Payment failed: ' + resp.error.description)
        setLoading(false)
      })
      rzp.open()

    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const addressStr = `${form.firstName} ${form.lastName}, ${form.line1}${form.line2 ? ', ' + form.line2 : ''}, ${form.city}, ${form.state} – ${form.pin}`

  return (
    <div className="checkout-inner">
      <div>
        {/* Step tabs */}
        <div className="step-tabs">
          {STEPS.map((label, i) => (
            <button key={label} className={`step-tab ${step === i + 1 ? 'active' : step > i + 1 ? 'done' : ''}`}>
              {step > i + 1 ? '✓ ' : ''}{label}
            </button>
          ))}
        </div>

        {error && (
          <div style={{ background: '#fff0f0', border: '1px solid #ffcccc', color: '#c0392b', padding: '10px 16px', borderRadius: 4, marginBottom: 16, fontSize: 13 }}>
            {error}
          </div>
        )}

        {/* ── Step 1: Address ────────────────────────────────────────────── */}
        {step === 1 && (
          <div>
            <h2>Delivery Address</h2>
            <div className="form-grid">
              <div className="form-group"><label className="field-label">First Name *</label><input type="text" value={form.firstName} onChange={set('firstName')} placeholder="Rahul" /></div>
              <div className="form-group"><label className="field-label">Last Name *</label><input type="text" value={form.lastName} onChange={set('lastName')} placeholder="Sharma" /></div>
              <div className="form-group"><label className="field-label">Email *</label><input type="email" value={form.email} onChange={set('email')} placeholder="rahul@email.com" /></div>
              <div className="form-group"><label className="field-label">Phone *</label><input type="tel" value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" /></div>
              <div className="form-group full"><label className="field-label">Address Line 1 *</label><input type="text" value={form.line1} onChange={set('line1')} placeholder="House No., Street, Area" /></div>
              <div className="form-group full"><label className="field-label">Address Line 2</label><input type="text" value={form.line2} onChange={set('line2')} placeholder="Landmark, Colony (optional)" /></div>
              <div className="form-group"><label className="field-label">City *</label><input type="text" value={form.city} onChange={set('city')} placeholder="Prayagraj" /></div>
              <div className="form-group">
                <label className="field-label">State *</label>
                <select value={form.state} onChange={set('state')}>
                  {['Uttar Pradesh','Maharashtra','Delhi','Rajasthan','Gujarat','Karnataka','Tamil Nadu','West Bengal','Bihar','Madhya Pradesh','Other'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group"><label className="field-label">PIN Code *</label><input type="text" value={form.pin} onChange={set('pin')} placeholder="211001" maxLength={6} /></div>
            </div>
            <button className="btn btn-primary" onClick={() => { if (validateAddress()) setStep(2) }}>
              Continue to Payment →
            </button>
          </div>
        )}

        {/* ── Step 2: Payment ────────────────────────────────────────────── */}
        {step === 2 && (
          <div>
            <h2>Payment Method</h2>
            <div className="payment-methods">
              {PAYMENT_OPTIONS.map((opt, i) => (
                <div key={opt.label} className={`payment-method ${paymentIdx === i ? 'selected' : ''}`} onClick={() => setPaymentIdx(i)}>
                  <input type="radio" readOnly checked={paymentIdx === i} />
                  <div>
                    <div style={{ fontSize: 14, color: 'var(--clay)', fontWeight: 500 }}>{opt.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 2 }}>{opt.sub}</div>
                  </div>
                  {opt.razorpay && (
                    <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-light)', border: '1px solid rgba(160,82,45,0.2)', padding: '2px 6px', borderRadius: 3 }}>
                      Razorpay
                    </span>
                  )}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button>
              <button className="btn btn-primary" onClick={() => setStep(3)}>Review Order →</button>
            </div>
          </div>
        )}

        {/* ── Step 3: Review ─────────────────────────────────────────────── */}
        {step === 3 && (
          <div>
            <h2>Review Your Order</h2>
            <div style={{ marginBottom: 28 }}>
              {items.map((item) => (
                <div key={item.key} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid rgba(160,82,45,0.1)' }}>
                  <div className="summary-item-img">
                    {item.product.images?.[0] ? <img src={item.product.images[0]} alt="" /> : null}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="summary-item-name">{item.product.name}</div>
                    <div className="summary-item-variant">{item.variant} × {item.quantity}</div>
                  </div>
                  <div style={{ fontWeight: 500, color: 'var(--clay)' }}>₹{item.product.price * item.quantity}</div>
                </div>
              ))}
            </div>

            <div style={{ background: 'rgba(160,82,45,0.05)', border: '1px solid rgba(160,82,45,0.15)', padding: 20, borderRadius: 4, marginBottom: 16, fontSize: 13, color: 'var(--text-mid)' }}>
              <strong style={{ color: 'var(--clay)', display: 'block', marginBottom: 6 }}>Delivery Address</strong>
              {addressStr}
            </div>

            <div style={{ background: 'rgba(160,82,45,0.05)', border: '1px solid rgba(160,82,45,0.15)', padding: 16, borderRadius: 4, marginBottom: 24, fontSize: 13, color: 'var(--text-mid)' }}>
              <strong style={{ color: 'var(--clay)', display: 'block', marginBottom: 4 }}>Payment</strong>
              {PAYMENT_OPTIONS[paymentIdx].label}
              {PAYMENT_OPTIONS[paymentIdx].razorpay && <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--text-light)' }}>(Secure via Razorpay)</span>}
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-ghost" onClick={() => setStep(2)}>← Back</button>
              <button
                className="btn btn-primary"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={placeOrder}
                disabled={loading}
              >
                {loading ? 'Processing…' : PAYMENT_OPTIONS[paymentIdx].razorpay ? 'Pay & Place Order →' : 'Place Order (COD) →'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Order Summary sidebar ──────────────────────────────────────────── */}
      <div className="order-summary">
        <h3>Order Summary</h3>
        {items.map((item) => (
          <div className="summary-item" key={item.key}>
            <div className="summary-item-img">
              {item.product.images?.[0] ? <img src={item.product.images[0]} alt="" /> : null}
            </div>
            <div style={{ flex: 1 }}>
              <div className="summary-item-name">{item.product.name}</div>
              <div className="summary-item-variant">{item.variant} × {item.quantity}</div>
            </div>
            <div className="summary-item-price">₹{item.product.price * item.quantity}</div>
          </div>
        ))}

        <div className="promo-row">
          <input type="text" placeholder="Promo code" value={promo} onChange={(e) => setPromo(e.target.value)} />
          <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={applyPromo}>Apply</button>
        </div>
        {promoMsg && <div style={{ fontSize: 12, marginBottom: 8, color: promoMsg.startsWith('✓') ? 'var(--leaf)' : '#c0392b' }}>{promoMsg}</div>}

        <div className="summary-row"><span>Subtotal</span><span>₹{total}</span></div>
        <div className="summary-row"><span>Delivery</span><span>{delivery === 0 ? 'FREE' : `₹${delivery}`}</span></div>
        {discount > 0 && <div className="summary-row"><span>Discount</span><span style={{ color: 'var(--leaf)' }}>−₹{discount}</span></div>}
        <div className="summary-row total"><span>Total</span><span>₹{grandTotal}</span></div>
        <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 12, textAlign: 'center' }}>
          🔒 Secure checkout powered by Razorpay
        </div>
      </div>
    </div>
  )
}
