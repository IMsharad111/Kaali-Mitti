import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

const NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
  { key: 'products', label: 'Products', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg> },
  { key: 'orders', label: 'Orders', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/></svg> },
  { key: 'certs', label: 'Certifications', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg> },
]

const STATUS_OPTIONS = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled']
const statusClass = { Pending: 'status-pending', Processing: 'status-processing', Shipped: 'status-processing', Delivered: 'status-delivered', Cancelled: 'status-pending' }

export default function Admin() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [activeProduct, setActiveProduct] = useState(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const fileRef = useRef()

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  // Load data
  useEffect(() => {
    api.get('/orders').then(r => setOrders(r.data)).catch(() => {})
    api.get('/products').then(r => { setProducts(r.data); setActiveProduct(r.data[0] || null) }).catch(() => {})
  }, [])

  const stats = {
    totalOrders: orders.length,
    revenue: orders.reduce((s, o) => s + (o.total || 0), 0),
    customers: new Set(orders.map(o => o.guestEmail || o.user?._id)).size,
    products: products.length,
  }

  // Product form state
  const [form, setForm] = useState({})
  useEffect(() => {
    if (activeProduct) {
      setForm({
        name: activeProduct.name,
        price: activeProduct.price,
        originalPrice: activeProduct.originalPrice,
        badge: activeProduct.badge,
        description: activeProduct.description,
        stock: activeProduct.stock,
      })
    }
  }, [activeProduct])

  const setF = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const saveProduct = async () => {
    if (!activeProduct) return
    setSaving(true)
    try {
      const { data } = await api.put(`/products/${activeProduct._id}`, form)
      setProducts(ps => ps.map(p => p._id === data._id ? data : p))
      setActiveProduct(data)
      showToast('Product saved successfully!')
    } catch { showToast('Error saving product') }
    finally { setSaving(false) }
  }

  const uploadImage = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !activeProduct) return
    const fd = new FormData(); fd.append('image', file)
    try {
      const { data } = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      const newImages = [...(activeProduct.images || []), data.url]
      const { data: updated } = await api.put(`/products/${activeProduct._id}`, { images: newImages })
      setProducts(ps => ps.map(p => p._id === updated._id ? updated : p))
      setActiveProduct(updated)
      showToast('Image uploaded!')
    } catch { showToast('Upload failed') }
  }

  const updateOrderStatus = async (orderId, status) => {
    try {
      const { data } = await api.put(`/orders/${orderId}/status`, { status })
      setOrders(os => os.map(o => o._id === data._id ? data : o))
      showToast('Order status updated')
    } catch { showToast('Failed to update status') }
  }

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <div className="admin-sidebar">
        <span className="logo">KAALIMITTI</span>
        <span className="admin-label">Admin Panel</span>
        <div className="admin-nav">
          {NAV.map(({ key, label, icon }) => (
            <button key={key} className={`admin-nav-item ${activeTab === key ? 'active' : ''}`} onClick={() => setActiveTab(key)}>
              {icon}{label}
            </button>
          ))}
          <button className="admin-nav-item" style={{ marginTop: 20, borderTop: '1px solid rgba(250,246,240,0.1)', paddingTop: 16 }} onClick={() => navigate('/')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            View Store
          </button>
          <button className="admin-nav-item" onClick={() => { logout(); navigate('/login') }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16,17 21,12 16,7"/></svg>
            Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="admin-content">

        {/* ── DASHBOARD ── */}
        {activeTab === 'dashboard' && (
          <div>
            <div className="admin-topbar">
              <h1>Dashboard</h1>
              <button className="btn btn-primary" style={{ fontSize: 12 }} onClick={() => navigate('/')}>View Live Store →</button>
            </div>
            <div className="admin-stats">
              {[
                { label: 'Total Orders', val: stats.totalOrders, change: `${orders.filter(o => o.status === 'Pending').length} pending` },
                { label: 'Revenue', val: `₹${stats.revenue.toLocaleString()}`, change: 'All time' },
                { label: 'Customers', val: stats.customers, change: 'Unique' },
                { label: 'Products', val: stats.products, change: 'All in stock' },
              ].map(({ label, val, change }) => (
                <div className="stat-card" key={label}>
                  <div className="stat-label">{label}</div>
                  <div className="stat-val">{val}</div>
                  <div className="stat-change">{change}</div>
                </div>
              ))}
            </div>
            <div className="admin-section-title">Recent Orders</div>
            <table className="admin-table">
              <thead><tr><th>Order ID</th><th>Customer</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {orders.slice(0, 8).map((o) => (
                  <tr key={o._id}>
                    <td>{o.orderId}</td>
                    <td>{o.guestName || o.user?.name || '—'}</td>
                    <td>₹{o.total}</td>
                    <td><span className={`status-badge ${statusClass[o.status] || 'status-pending'}`}>{o.status}</span></td>
                    <td>{new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  </tr>
                ))}
                {orders.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-light)' }}>No orders yet</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* ── PRODUCTS ── */}
        {activeTab === 'products' && (
          <div>
            <div className="admin-topbar"><h1>Products</h1></div>
            <div className="admin-tabs">
              {products.map((p) => (
                <button key={p._id} className={`admin-tab ${activeProduct?._id === p._id ? 'active' : ''}`} onClick={() => setActiveProduct(p)}>
                  {p.name}
                </button>
              ))}
            </div>
            {activeProduct && (
              <div className="product-edit-form">
                <h3>Edit: {activeProduct.name}</h3>
                <div className="form-grid">
                  <div className="form-group"><label className="field-label">Product Name</label><input type="text" value={form.name || ''} onChange={setF('name')} /></div>
                  <div className="form-group"><label className="field-label">Price (₹)</label><input type="text" value={form.price || ''} onChange={setF('price')} /></div>
                  <div className="form-group"><label className="field-label">Original Price (₹)</label><input type="text" value={form.originalPrice || ''} onChange={setF('originalPrice')} /></div>
                  <div className="form-group"><label className="field-label">Badge</label><input type="text" value={form.badge || ''} onChange={setF('badge')} /></div>
                  <div className="form-group full"><label className="field-label">Description</label><textarea rows={4} value={form.description || ''} onChange={setF('description')} /></div>
                </div>

                {/* Existing images */}
                {activeProduct.images?.length > 0 && (
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
                    {activeProduct.images.map((img, i) => (
                      <div key={i} style={{ width: 80, height: 80, borderRadius: 4, overflow: 'hidden', border: '1px solid rgba(160,82,45,0.2)', position: 'relative' }}>
                        <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload */}
                <div className="img-upload-area" onClick={() => fileRef.current?.click()}>
                  <svg width="32" height="32" fill="none" stroke="var(--clay-light)" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17,8 12,3 7,8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  <p>Click to upload product image<br /><span style={{ fontSize: 11 }}>JPG, PNG, WEBP — up to 5MB</span></p>
                </div>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={uploadImage} />

                <button className="btn btn-primary" onClick={saveProduct} disabled={saving}>
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── ORDERS ── */}
        {activeTab === 'orders' && (
          <div>
            <div className="admin-topbar"><h1>Orders</h1></div>
            <table className="admin-table">
              <thead><tr><th>Order ID</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Date</th><th>Update</th></tr></thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o._id}>
                    <td>{o.orderId}</td>
                    <td>
                      <div>{o.guestName || o.user?.name || '—'}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-light)' }}>{o.guestEmail || o.user?.email}</div>
                    </td>
                    <td>{o.items?.length} item(s)</td>
                    <td>₹{o.total}</td>
                    <td><span className={`status-badge ${statusClass[o.status] || 'status-pending'}`}>{o.status}</span></td>
                    <td>{new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                    <td>
                      <select className="admin-order-status-select" value={o.status} onChange={(e) => updateOrderStatus(o._id, e.target.value)}>
                        {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-light)' }}>No orders yet</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* ── CERTIFICATIONS ── */}
        {activeTab === 'certs' && (
          <div>
            <div className="admin-topbar"><h1>Certifications</h1></div>
            <p style={{ fontSize: 14, color: 'var(--text-mid)', marginBottom: 28 }}>
              Upload your certification documents here. Once uploaded, they appear on the public Certifications section of the store.
            </p>
            {[
              { icon: '🌿', title: 'Derma Verified', desc: 'Dermatologically tested certificate' },
              { icon: '🌍', title: 'Soil Quality Certified', desc: 'Mineral purity test report' },
              { icon: '🏺', title: 'Ayurvedic Standard', desc: 'AYUSH certification document' },
              { icon: '🔬', title: 'Lab Tested', desc: 'Third-party lab safety report' },
            ].map(({ icon, title, desc }) => (
              <div key={title} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, border: '1px solid rgba(160,82,45,0.1)', borderRadius: 4, marginBottom: 12, background: 'var(--white)' }}>
                <div style={{ width: 44, height: 44, background: 'var(--cream-dark)', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, color: 'var(--clay)', marginBottom: 2 }}>{title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-light)' }}>{desc}</div>
                </div>
                <button className="btn btn-outline" style={{ fontSize: 11 }} onClick={() => showToast('Certificate upload backend — connect your file API')}>
                  Upload
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={`toast ${toast ? 'show' : ''}`}>{toast}</div>
    </div>
  )
}
