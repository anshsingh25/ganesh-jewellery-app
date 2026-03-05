# Ganesh Jewellers Backend

Node.js + Express server with MySQL for multi-device sync and Razorpay for payments.

## Setup

1. **MySQL**: Create a database (e.g. `ganesh_jewellers`).

2. **Environment**: Copy `.env.example` to `.env` and configure:
   - `MYSQL_*` – MySQL connection
   - `JWT_SECRET` – Change in production
   - `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` – For UPI/Card payments

3. **Initialize DB**:
   ```bash
   npm run init-db
   ```
   Creates tables and default owner (pin: `1234`).

4. **Start server**:
   ```bash
   npm start
   ```

## API

- **Auth**: `POST /api/auth/owner-login`, `POST /api/auth/customer-login`
- **Customers**: `GET/POST/PUT/DELETE /api/customers` (owner JWT)
- **Schemes**: `GET/POST/PUT/DELETE /api/schemes` (owner JWT)
- **Settings**: `GET/PUT /api/settings/min-amount` (owner JWT)
- **Customer self**: `GET/PUT /api/me` (customer JWT)
- **Payments**: `POST /api/create-order`, `POST /api/verify-payment`, `GET /checkout`

## App configuration

In the app Settings, set **Server URL** to your deployed backend (e.g. `https://your-domain.com`). Restart the app to enable multi-device sync.
