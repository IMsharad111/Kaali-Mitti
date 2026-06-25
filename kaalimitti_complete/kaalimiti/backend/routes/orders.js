const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');
const { sendOrderConfirmation, sendAdminOrderAlert, sendStatusUpdate } = require('../services/email');

// POST /api/orders — create order
router.post('/', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentMethod, items, ...rest } = req.body;

    // 1. Verify Razorpay for online payments
    let paymentVerified = false;
    if (paymentMethod !== 'Cash on Delivery') {
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ message: 'Payment details missing. Please complete payment.' });
      }
      const expectedSig = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(razorpay_order_id + '|' + razorpay_payment_id)
        .digest('hex');
      if (expectedSig !== razorpay_signature) {
        return res.status(400).json({ message: 'Payment verification failed.' });
      }
      paymentVerified = true;
    }

    // 2. Stock check
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) return res.status(404).json({ message: `Product not found: ${item.name}` });
      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `Only ${product.stock} units left for "${product.name}"` });
      }
    }

    // 3. Decrement stock
    for (const item of items) {
      const updated = await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } }, { new: true });
      if (updated.stock <= 0) await Product.findByIdAndUpdate(item.product, { inStock: false });
    }

    // 4. Create order
    const order = await Order.create({
      ...rest, items, paymentMethod,
      paymentVerified,
      razorpayOrderId: razorpay_order_id || null,
      razorpayPaymentId: razorpay_payment_id || null,
    });

    // 5. Emails (non-blocking)
    sendOrderConfirmation(order).catch(e => console.error('Confirm email:', e.message));
    sendAdminOrderAlert(order).catch(e => console.error('Admin email:', e.message));

    res.status(201).json(order);
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/orders/mine
router.get('/mine', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/orders/stats/summary
router.get('/stats/summary', protect, adminOnly, async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const rev = await Order.aggregate([{ $group: { _id: null, total: { $sum: '$total' } } }]);
    res.json({ totalOrders, revenue: rev[0]?.total || 0 });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/orders — admin all
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 }).populate('user', 'name email');
    res.json(orders);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT /api/orders/:id/status
router.put('/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    sendStatusUpdate(order).catch(e => console.error('Status email:', e.message));
    res.json(order);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
