// services/email.js  –  Nodemailer + Gmail SMTP
const nodemailer = require('nodemailer');

// ── Transport ───────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD, // Gmail App Password (not your real password)
  },
});

// ── Helper: branded email wrapper ───────────────────────────────────────────
const wrap = (body) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Georgia, serif; background: #fdf8f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 32px auto; background: #fff; border-radius: 6px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.07); }
    .header { background: #3d1f0d; padding: 24px 32px; }
    .logo { color: #f5e6d3; font-size: 22px; font-weight: bold; letter-spacing: 2px; }
    .logo span { color: #c8a882; }
    .body { padding: 32px; color: #4a3728; }
    h2 { color: #3d1f0d; margin-top: 0; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; background: #e8f5e9; color: #2e7d32; }
    .order-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .order-table th { background: #f5ede3; color: #5a3825; padding: 10px 12px; text-align: left; font-size: 12px; letter-spacing: 0.5px; }
    .order-table td { padding: 10px 12px; border-bottom: 1px solid #f0e8df; font-size: 13px; }
    .total-row td { font-weight: bold; color: #3d1f0d; border-top: 2px solid #c8a882; }
    .footer { background: #f5ede3; padding: 20px 32px; font-size: 11px; color: #8a7060; text-align: center; }
    .btn { display: inline-block; padding: 12px 28px; background: #a0522d; color: #fff; text-decoration: none; border-radius: 4px; font-size: 14px; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><div class="logo">KAALI<span>MITTI</span></div></div>
    <div class="body">${body}</div>
    <div class="footer">
      Kaalimitti — Natural Clay Skincare<br>
      Questions? Reply to this email or contact us at ${process.env.GMAIL_USER}
    </div>
  </div>
</body>
</html>`;

// ── 1. Order Confirmation (to customer) ────────────────────────────────────
const sendOrderConfirmation = async (order) => {
  const itemRows = order.items.map(i => `
    <tr>
      <td>${i.name}${i.variant ? ` (${i.variant})` : ''}</td>
      <td style="text-align:center">${i.quantity}</td>
      <td style="text-align:right">₹${(i.price * i.quantity).toLocaleString()}</td>
    </tr>`).join('');

  const html = wrap(`
    <h2>Order Confirmed! 🎉</h2>
    <p>Hi <strong>${order.address.firstName}</strong>,</p>
    <p>Thank you for your order. We've received it and will start processing soon.</p>

    <p><strong>Order ID:</strong> <span class="badge">${order.orderId}</span></p>

    <table class="order-table">
      <thead><tr><th>Item</th><th style="text-align:center">Qty</th><th style="text-align:right">Price</th></tr></thead>
      <tbody>
        ${itemRows}
        <tr><td colspan="2">Subtotal</td><td style="text-align:right">₹${order.subtotal?.toLocaleString()}</td></tr>
        <tr><td colspan="2">Delivery</td><td style="text-align:right">${order.deliveryFee === 0 ? 'FREE' : '₹' + order.deliveryFee}</td></tr>
        ${order.discount > 0 ? `<tr><td colspan="2">Discount</td><td style="text-align:right; color:#2e7d32">−₹${order.discount}</td></tr>` : ''}
        <tr class="total-row"><td colspan="2">Total Paid</td><td style="text-align:right">₹${order.total?.toLocaleString()}</td></tr>
      </tbody>
    </table>

    <p><strong>Delivery to:</strong><br>
    ${order.address.line1}${order.address.line2 ? ', ' + order.address.line2 : ''}, ${order.address.city}, ${order.address.state} – ${order.address.pin}<br>
    📞 ${order.address.phone}</p>

    <p style="margin-top:24px; font-size:13px; color:#8a7060;">
      Payment Method: ${order.paymentMethod}<br>
      Expected delivery: 5–7 business days
    </p>
  `);

  await transporter.sendMail({
    from: `"Kaalimitti" <${process.env.GMAIL_USER}>`,
    to: order.address.email || order.guestEmail,
    subject: `Order Confirmed — ${order.orderId} | Kaalimitti`,
    html,
  });
};

// ── 2. Order Status Update (to customer) ───────────────────────────────────
const sendStatusUpdate = async (order) => {
  const statusMessages = {
    Processing: { emoji: '⚙️', msg: 'Your order is being prepared with care.' },
    Shipped:    { emoji: '🚚', msg: 'Your order is on its way! Expect it in 2–4 days.' },
    Delivered:  { emoji: '✅', msg: 'Your order has been delivered. Enjoy your Kaalimitti products!' },
    Cancelled:  { emoji: '❌', msg: 'Your order has been cancelled. If this is unexpected, please contact us.' },
  };

  const info = statusMessages[order.status] || { emoji: '📦', msg: 'Your order status has been updated.' };
  const customerEmail = order.address?.email || order.guestEmail;
  if (!customerEmail) return;

  const html = wrap(`
    <h2>${info.emoji} Order ${order.status}</h2>
    <p>Hi <strong>${order.address?.firstName || order.guestName || 'there'}</strong>,</p>
    <p>${info.msg}</p>
    <p><strong>Order ID:</strong> <span class="badge">${order.orderId}</span></p>
    <p style="margin-top:24px; font-size:13px; color:#8a7060;">
      Total: ₹${order.total?.toLocaleString()}<br>
      Payment: ${order.paymentMethod}
    </p>
  `);

  await transporter.sendMail({
    from: `"Kaalimitti" <${process.env.GMAIL_USER}>`,
    to: customerEmail,
    subject: `Order ${order.status} — ${order.orderId} | Kaalimitti`,
    html,
  });
};

// ── 3. New Order Alert (to admin) ──────────────────────────────────────────
const sendAdminOrderAlert = async (order) => {
  const itemRows = order.items.map(i =>
    `<tr><td>${i.name} (${i.variant || 'default'})</td><td style="text-align:center">${i.quantity}</td><td style="text-align:right">₹${i.price * i.quantity}</td></tr>`
  ).join('');

  const html = wrap(`
    <h2>🛒 New Order Received</h2>
    <p><strong>Order ID:</strong> ${order.orderId}</p>
    <p><strong>Customer:</strong> ${order.address.firstName} ${order.address.lastName} (${order.address.email || order.guestEmail})</p>
    <p><strong>Phone:</strong> ${order.address.phone}</p>
    <p><strong>Address:</strong> ${order.address.line1}, ${order.address.city}, ${order.address.state} – ${order.address.pin}</p>
    <p><strong>Payment:</strong> ${order.paymentMethod} | <strong>Total:</strong> ₹${order.total?.toLocaleString()}</p>
    <table class="order-table">
      <thead><tr><th>Item</th><th style="text-align:center">Qty</th><th style="text-align:right">Price</th></tr></thead>
      <tbody>${itemRows}</tbody>
    </table>
  `);

  await transporter.sendMail({
    from: `"Kaalimitti Orders" <${process.env.GMAIL_USER}>`,
    to: process.env.GMAIL_USER,
    subject: `[NEW ORDER] ${order.orderId} — ₹${order.total}`,
    html,
  });
};

module.exports = { sendOrderConfirmation, sendStatusUpdate, sendAdminOrderAlert };
