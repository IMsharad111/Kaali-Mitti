import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

const NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
  { key: 'products', label: 'Products', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg> },
  { key: 'orders', label: 'Orders', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/></svg> },
  { key: 'content', label: 'Content', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg> },
  { key: 'certs', label: 'Certifications', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg> },
]

const STATUS_OPTIONS = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled']
const statusClass = { Pending: 'status-pending', Processing: 'status-processing', Shipped: 'status-processing', Delivered: 'status-delivered', Cancelled: 'status-pending' }
const emptyForm = { name: '', price: '', originalPrice: '', badge: '', description: '', stock: 0, slug: '' }

export default function Admin() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [activeProduct, setActiveProduct] = useState(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [content, setContent] = useState({})
  const [uploadingKey, setUploadingKey] = useState('')
  const fileRef = useRef()
  const contentFileRef = useRef()
  const [pendingContentKey, setPendingContentKey] = useState('')

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  useEffect(() => {
    api.get('/orders').then(r => setOrders(r.data)).catch(() => {})
    api.get('/products').then(r => { setProducts(r.data); setActiveProduct(r.data[0] || null) }).catch(() => {})
    api.get('/content').then(r => setContent(r.data)).catch(() => {})
  }, [])

  const stats = {
    totalOrders: orders.length,
    revenue: orders.reduce((s, o) => s + (o.total || 0), 0),
    customers: new Set(orders.map(o => o.guestEmail || o.user?._id)).size,
    products: products.length,
  }

  const [form, setForm] = useState({})
  useEffect(() => {
    if (activeProduct && !isAdding) {
      setForm({
        name: activeProduct.name,
        price: activeProduct.price,
        originalPrice: activeProduct.originalPrice,
        badge: activeProduct.badge,
        description: activeProduct.description,
        stock: activeProduct.stock ?? 0,
        slug: activeProduct.slug,
      })
    }
  }, [activeProduct, isAdding])

  const setF = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const saveProduct = async () => {
    setSaving(true)
    try {
      if (isAdding) {
        const { data } = await api.post('/products', { ...form, inStock: Number(form.stock) > 0 })
        setProducts(ps => [...ps, data])
        setActiveProduct(data)
        setIsAdding(false)
        showToast('Product added successfully!')
      } else {
        if (!activeProduct) return
        const { data } = await api.put(`/products/${activeProduct._id}`, { ...form, inStock: Number(form.stock) > 0 })
        setProducts(ps => ps.map(p => p._id === data._id ? data : p))
        setActiveProduct(data)
        showToast('Product saved successfully!')
      }
    } catch { showToast('Error saving product') }
    finally { setSaving(false) }
  }

  const uploadProductImage = async (e) => {
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

  const uploadContentImage = async (e, key) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingKey(key)
    const fd = new FormData(); fd.append('image', file)
    try {
      const { data } = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      const currentArr = Array.isArray(content[key]) ? content[key] : []
      let newValue
      if (key === 'hero_images') {
        if (currentArr.length >= 4) { showToast('Maximum 4 hero images allowed'); return }
        newValue = [...currentArr, data.url]
      } else {
        newValue = data.url
      }
      await api.post('/content', { key, value: newValue })
      setContent(c => ({ ...c, [key]: newValue }))
      showToast('Image uploaded!')
    } catch { showToast('Upload failed') }
    finally { setUploadingKey('') }
  }

  const removeHeroImage = async (idx) => {
    const newArr = content.hero_images.filter((_, i) => i !== idx)
    await api.post('/content', { key: 'hero_images', value: newArr })
    setContent(c => ({ ...c, hero_images: newArr }))
    showToast('Image removed!')
  }

  const updateOrderStatus = async (orderId, status) => {
    try {
      const { data } = await api.put(`/orders/${orderId}/status`, { status })
      setOrders(os => os.map(o => o._id === data._id ? data : o))
      showToast('Order status updated')
    } catch { showToast('Failed to update status') }
  }

  const startAddProduct = () => {
    setIsAdding(true)
    setActiveProduct(null)
    setForm(emptyForm)
  }

  const ContentUploadBox = ({ label, contentKey, single = true }) => {
    const ref = useRef()
    const val = content[contentKey]
    const imgs = single ? (val ? [val] : []) : (Array.isArray(val) ? val : [])
    return (
      <div style={{ background: 'var(--white)', border: '1px solid rgba(160,82,45,0.1)', borderRadius: 4, padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--clay)', marginBottom: 12 }}>{label}</div>
        {imgs.length > 0 && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
            {imgs.map((img, i) => (
              <div key={i} style={{ position: 'relative', width: 100, height: 100 }}>
                <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4, border: '1px solid rgba(160,82,45,0.2)' }} />
                <button onClick={() => contentKey === 'hero_images' ? removeHeroImage(i) : (api.post('/content', { key: contentKey, value: null }), setContent(c => ({ ...c, [contentKey]: null })))}
                  style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: 'var(--clay)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
              </div>
            ))}
          </div>
        )}
        {(single ? imgs.length === 0 : imgs.length < 4) && (
          <div className="img-upload-area" onClick={() => ref.current?.click()} style={{ padding: '16px', marginBottom: 0 }}>
            {uploadingKey === contentKey ? <p style={{ fontSize: 13 }}>Uploading...</p> : (
              <>
                <svg width="24" height="24" fill="none" stroke="var(--clay-light)" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17,8 12,3 7,8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <p style={{ fontSize: 12 }}>{contentKey === 'hero_images' ? `Click to upload (${imgs.length}/4 added)` : 'Click to upload image'}</p>
              </>
            )}
          </div>
        )}
        <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => uploadContentImage(e, contentKey)} />
      </div>
    )
  }

  return (
    <div className="admin-layout">
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

      <div className="admin-content">

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

        {activeTab === 'products' && (
          <div>
            <div className="admin-topbar">
              <h1>Products</h1>
              <button className="btn btn-primary" style={{ fontSize: 12 }} onClick={startAddProduct}>+ Add Product</button>
            </div>
            <div className="admin-tabs">
              {products.map((p) => (
                <button key={p._id} className={`admin-tab ${!isAdding && activeProduct?._id === p._id ? 'active' : ''}`} onClick={() => { setIsAdding(false); setActiveProduct(p) }}>
                  {p.name}
                </button>
              ))}
              {isAdding && <button className="admin-tab active">New Product</button>}
            </div>
            {(activeProduct || isAdding) && (
              <div className="product-edit-form">
                <h3>{isAdding ? 'Add New Product' : `Edit: ${activeProduct.name}`}</h3>
                <div className="form-grid">
                  <div className="form-group"><label className="field-label">Product Name</label><input type="text" value={form.name || ''} onChange={setF('name')} /></div>
                  <div className="form-group"><label className="field-label">Price (₹)</label><input type="number" value={form.price || ''} onChange={setF('price')} /></div>
                  <div className="form-group"><label className="field-label">Original Price (₹)</label><input type="number" value={form.originalPrice || ''} onChange={setF('originalPrice')} /></div>
                  <div className="form-group"><label className="field-label">Badge</label><input type="text" value={form.badge || ''} onChange={setF('badge')} /></div>
                  <div className="form-group"><label className="field-label">Stock (quantity)</label><input type="number" min="0" value={form.stock ?? 0} onChange={setF('stock')} /></div>
                  <div className="form-group"><label className="field-label">Slug (URL)</label><input type="text" value={form.slug || ''} onChange={setF('slug')} placeholder="e.g. facepack" /></div>
                  <div className="form-group full"><label className="field-label">Description</label><textarea rows={4} value={form.description || ''} onChange={setF('description')} /></div>
                </div>
                {!isAdding && activeProduct?.images?.length > 0 && (
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
                    {activeProduct.images.map((img, i) => (
                      <div key={i} style={{ width: 80, height: 80, borderRadius: 4, overflow: 'hidden', border: '1px solid rgba(160,82,45,0.2)' }}>
                        <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ))}
                  </div>
                )}
                {!isAdding && (
                  <>
                    <div className="img-upload-area" onClick={() => fileRef.current?.click()}>
                      <svg width="32" height="32" fill="none" stroke="var(--clay-light)" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17,8 12,3 7,8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      <p>Click to upload product image<br /><span style={{ fontSize: 11 }}>JPG, PNG, WEBP — up to 5MB</span></p>
                    </div>
                    <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={uploadProductImage} />
                  </>
                )}
                <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                  <button className="btn btn-primary" onClick={saveProduct} disabled={saving}>
                    {saving ? 'Saving…' : isAdding ? 'Add Product' : 'Save Changes'}
                  </button>
                  {isAdding && (
                    <button className="btn btn-outline" onClick={() => { setIsAdding(false); setActiveProduct(products[0] || null) }}>Cancel</button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

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

        {activeTab === 'content' && (
          <div>
            <div className="admin-topbar"><h1>Content & Images</h1></div>
            <p style={{ fontSize: 13, color: 'var(--text-mid)', marginBottom: 24 }}>Upload images for different sections of your website. Changes appear instantly on the live store.</p>

            <div className="admin-section-title">Hero Section (up to 4 images)</div>
            <p style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 12 }}>These images appear in the grid on the homepage hero. Only uploaded images are shown — upload 1 to 4.</p>
            <ContentUploadBox label="Hero Images" contentKey="hero_images" single={false} />

            <div className="admin-section-title" style={{ marginTop: 24 }}>Ingredients / History Section</div>
            <ContentUploadBox label="Historical / Story Image" contentKey="history_image" single={true} />

            <div className="admin-section-title" style={{ marginTop: 24 }}>Process Steps</div>
            <ContentUploadBox label="Step 01 — Ethical Harvesting" contentKey="process_1" single={true} />
            <ContentUploadBox label="Step 02 — Sun Drying" contentKey="process_2" single={true} />
            <ContentUploadBox label="Step 03 — Purification & Testing" contentKey="process_3" single={true} />
            <ContentUploadBox label="Step 04 — Formulation" contentKey="process_4" single={true} />
          </div>
        )}

        {activeTab === 'certs' && (
          <div>
            <div className="admin-topbar"><h1>Certifications</h1></div>
            <p style={{ fontSize: 14, color: 'var(--text-mid)', marginBottom: 28 }}>Upload your certification documents here.</p>
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
                <button className="btn btn-outline" style={{ fontSize: 11 }} onClick={() => showToast('Certificate upload coming soon')}>Upload</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={`toast ${toast ? 'show' : ''}`}>{toast}</div>
    </div>
  )
}
