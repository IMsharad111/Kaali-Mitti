const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name:     String,
  variant:  String,
  quantity: { type: Number, default: 1 },
  price:    Number,
  image:    String,
});

const orderSchema = new mongoose.Schema(
  {
    orderId:           { type: String, default: () => 'KM-' + Math.floor(10000 + Math.random() * 90000) },
    user:              { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    guestName:         String,
    guestEmail:        String,
    items:             [orderItemSchema],
    address: {
      firstName: String, lastName: String, email: String, phone: String,
      line1: String, line2: String, city: String, state: String, pin: String,
    },
    paymentMethod:     { type: String, default: 'UPI' },
    paymentVerified:   { type: Boolean, default: false },
    razorpayOrderId:   { type: String, default: null },
    razorpayPaymentId: { type: String, default: null },
    subtotal:          Number,
    deliveryFee:       { type: Number, default: 49 },
    discount:          { type: Number, default: 0 },
    total:             Number,
    status: {
      type: String,
      enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
      default: 'Pending',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
