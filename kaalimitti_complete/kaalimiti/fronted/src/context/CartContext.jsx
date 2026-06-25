import { createContext, useContext, useState, useEffect } from 'react'

const CartContext = createContext()
const CART_KEY = 'km_cart'

export const CartProvider = ({ children }) => {
  // Persist cart in localStorage so it survives page refresh
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem(CART_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [isOpen, setIsOpen] = useState(false)

  // Sync to localStorage whenever items change
  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(items))
    } catch {}
  }, [items])

  const addToCart = (product, variant = '', quantity = 1) => {
    setItems((prev) => {
      const key = product._id + variant
      const existing = prev.find((i) => i.key === key)
      if (existing) {
        return prev.map((i) => i.key === key ? { ...i, quantity: i.quantity + quantity } : i)
      }
      return [...prev, { key, product, variant, quantity }]
    })
  }

  const removeFromCart = (key) => setItems((prev) => prev.filter((i) => i.key !== key))

  const updateQty = (key, delta) => {
    setItems((prev) =>
      prev.map((i) => i.key === key ? { ...i, quantity: i.quantity + delta } : i)
          .filter((i) => i.quantity > 0)
    )
  }

  const clearCart = () => {
    setItems([])
    localStorage.removeItem(CART_KEY)
  }

  const total = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0)
  const count = items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQty, clearCart, total, count, isOpen, setIsOpen }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
