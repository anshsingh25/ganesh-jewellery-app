/**
 * Ganesh Jewellers - Backend (MySQL + Razorpay)
 * Run: npm install && npm run init-db && node index.js
 * .env: MYSQL_*, RAZORPAY_*, JWT_SECRET
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Razorpay = require('razorpay');
const { authMiddleware, ownerOnly } = require('./middleware/auth');
const { router: authRouter } = require('./routes/auth');
const customersRouter = require('./routes/customers');
const schemesRouter = require('./routes/schemes');
const settingsRouter = require('./routes/settings');
const meRouter = require('./routes/me');

const app = express();
const PORT = process.env.PORT || 3000;
const KEY_ID = process.env.RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const APP_SCHEME = process.env.APP_SCHEME || 'ganeshjewellers';

if (!KEY_ID || !KEY_SECRET) {
  console.warn('Warning: Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env for payments.');
}

const razorpay = KEY_ID && KEY_SECRET ? new Razorpay({ key_id: KEY_ID, key_secret: KEY_SECRET }) : null;

app.use(cors());
app.use(express.json());

// Root - so browser shows something instead of "page isn't working"
app.get('/', (req, res) => {
  const protocol = req.get('x-forwarded-proto') || req.protocol || 'https';
  const host = req.get('x-forwarded-host') || req.get('host') || 'localhost';
  const serverUrl = `${protocol}://${host}`.replace(/\/$/, '');
  res.type('html').send(`
    <!DOCTYPE html>
    <html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ganesh Jewellers API</title></head>
    <body style="font-family:system-ui;padding:2rem;max-width:480px;margin:0 auto;">
      <h1 style="color:#8B6914;">Ganesh Jewellers</h1>
      <p>API server is running. Use the mobile app and set <strong>Server URL</strong> to:</p>
      <p style="background:#f5f5f5;padding:0.75rem;border-radius:8px;word-break:break-all;"><strong>${serverUrl}</strong></p>
      <p>in the app Settings, then log in with PIN 1234.</p>
      <p><small>Auth: POST /api/auth/owner-login, /api/auth/customer-login &middot; API: /api/customers, /api/schemes, /api/settings</small></p>
    </body></html>
  `);
});

// Auth (no JWT required)
app.use('/api/auth', authRouter);

// Owner-only API (JWT required)
app.use('/api/customers', authMiddleware, ownerOnly, customersRouter);
app.use('/api/schemes', authMiddleware, ownerOnly, schemesRouter);
app.use('/api/settings', authMiddleware, settingsRouter);
app.use('/api/me', authMiddleware, meRouter);

// Payment endpoints (no auth - called from app with order context)
app.post('/api/create-order', async (req, res) => {
  if (!razorpay) {
    return res.status(503).json({ error: 'Payment not configured. Set Razorpay keys in .env' });
  }
  const { amount, currency = 'INR', receipt, customerId, installmentId, customerName } = req.body;
  const amountPaise = Math.round(parseFloat(amount) * 100) || 0;
  if (amountPaise < 100) {
    return res.status(400).json({ error: 'Amount must be at least ₹1' });
  }
  try {
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency,
      receipt: receipt || `emi-${Date.now()}`,
      notes: {
        customerId: customerId || '',
        installmentId: installmentId || '',
        customerName: customerName || '',
      },
    });
    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: KEY_ID,
    });
  } catch (e) {
    console.error('Create order error:', e);
    res.status(500).json({ error: e.message || 'Failed to create order' });
  }
});

app.post('/api/verify-payment', async (req, res) => {
  const { orderId, paymentId, signature } = req.body;
  if (!orderId || !paymentId || !signature) {
    return res.status(400).json({ error: 'Missing orderId, paymentId or signature' });
  }
  const crypto = require('crypto');
  const body = orderId + '|' + paymentId;
  const expected = crypto.createHmac('sha256', KEY_SECRET).update(body).digest('hex');
  const valid = expected === signature;
  res.json({ success: valid, orderId, paymentId });
});

app.get('/checkout', (req, res) => {
  const orderId = req.query.order_id;
  const keyId = req.query.key_id || KEY_ID;
  const redirectScheme = req.query.redirect_scheme || APP_SCHEME;
  if (!orderId || !keyId) {
    return res.status(400).send('Missing order_id or key_id');
  }
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  <title>Pay - Ganesh Jewellers</title>
</head>
<body style="font-family: system-ui; padding: 20px; max-width: 400px; margin: 0 auto;">
  <h2>Ganesh Jewellers</h2>
  <p>Complete your EMI payment via UPI, Card or Net Banking.</p>
  <button id="pay-btn" style="padding: 12px 24px; background: #B8860B; color: #fff; border: none; border-radius: 8px; font-size: 16px; cursor: pointer;">Pay now</button>
  <script>
    var options = {
      key: "${keyId.replace(/"/g, '\\"')}",
      amount: 0,
      order_id: "${orderId.replace(/"/g, '\\"')}",
      name: "Ganesh Jewellers",
      description: "EMI Payment",
      handler: function (response) {
        var url = "${redirectScheme}://payment/success?order_id=" + encodeURIComponent(response.razorpay_order_id) + "&payment_id=" + encodeURIComponent(response.razorpay_payment_id) + "&signature=" + encodeURIComponent(response.razorpay_signature);
        window.location.href = url;
      },
      prefill: {},
      theme: { color: "#B8860B" }
    };
    document.getElementById('pay-btn').onclick = function() {
      var rzp = new Razorpay(options);
      rzp.open();
    };
  </script>
</body>
</html>
  `;
  res.send(html);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Ganesh Jewellers server at http://0.0.0.0:${PORT}`);
  console.log('Auth: POST /api/auth/owner-login, POST /api/auth/customer-login');
  console.log('API: /api/customers, /api/schemes, /api/settings');
  console.log('Payments: POST /api/create-order, POST /api/verify-payment, GET /checkout');
});
