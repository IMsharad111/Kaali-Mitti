import { useCart } from '../context/CartContext'
import { useNavigate } from 'react-router-dom'

export default function CartSidebar() {
  const { items, isOpen, setIsOpen, updateQty, removeFromCart, total } = useCart()
  const navigate = useNavigate()

  const checkout = () => {
    setIsOpen(false)
    navigate('/checkout')
  }

  return (
    <>
      <div className={`cart-overlay ${isOpen ? 'open' : ''}`} onClick={() => setIsOpen(false)} />
      <div className={`cart-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="cart-header">
          <h3>Your Cart</h3>
          <button className="close-btn" onClick={() => setIsOpen(false)}>×</button>
        </div>

        <div className="cart-items">
          {items.length === 0 ? (
            <div className="empty-cart">
              <svg width="48" height="48" fill="none" stroke="var(--clay-light)" strokeWidth="1" viewBox="0 0 24 24">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
              <p>Your cart is empty</p>
            </div>
          ) : (
            items.map((item) => (
              <div className="cart-item" key={item.key}>
                <div className="cart-item-img">
                  {item.product.images?.[0]
                    ? <img src={item.product.images[0]} alt={item.product.name} />
                    : <span style={{ fontSize: 10, color: 'var(--text-light)' }}>No img</span>
                  }
                </div>
                <div className="cart-item-info">
                  <div className="cart-item-name">{item.product.name}</div>
                  <div className="cart-item-variant">{item.variant}</div>
                  <div className="cart-item-row">
                    <span className="cart-item-price">₹{item.product.price * item.quantity}</span>
                    <div className="cart-item-qty">
                      <button onClick={() => updateQty(item.key, -1)}>−</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQty(item.key, 1)}>+</button>
                      <button onClick={() => removeFromCart(item.key)} style={{ color: 'var(--text-light)', marginLeft: 4 }}>✕</button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="cart-footer">
            <div className="cart-total-row">
              <span className="cart-total-label">Total</span>
              <span className="cart-total-val">₹{total}</span>
            </div>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px' }} onClick={checkout}>
              Proceed to Checkout →
            </button>
          </div>
        )}
      </div>
    </>
  )
}
