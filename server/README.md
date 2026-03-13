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

## Railway deploy

- Set **Root Directory** to `server` for the app service.
- **Connect MySQL to the app** so the app receives DB credentials:
  - In the **MySQL** service → **Variables** → use **“Add variable reference”** (or **Connect**), and add each variable to the **ganesh-jewellery-app** service: `MYSQL_HOST` ← `MySQL.MYSQLHOST`, `MYSQL_PORT` ← `MySQL.MYSQLPORT`, `MYSQL_USER` ← `MySQL.MYSQLUSER`, `MYSQL_PASSWORD` ← `MySQL.MYSQLPASSWORD`, `MYSQL_DATABASE` ← `MySQL.MYSQLDATABASE`. The code also accepts Railway’s names directly: `MYSQLHOST`, `MYSQLPORT`, etc.
- Ensure both services are in the same project so the app can reach `mysql.railway.internal`.

## App configuration

In the app Settings, set **Server URL** to your deployed backen
o0'/ bhd (e.g. `https://your-domain.com`). Restart the app to enable multi-device sync.
