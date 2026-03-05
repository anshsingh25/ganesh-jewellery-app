# Ganesh Jewellers – EMI App

Cross-platform mobile app (iOS & Android) for managing **5-month** and **11-month EMI schemes**, reminders, and customer tracking.

---

## How to run

```bash
npm install
npm start
```

Then press **i** for iOS simulator or **a** for Android emulator, or scan the QR code with Expo Go on your phone.

---

## What this app does (with examples)

### 1. Add customer → Auto EMI schedule

When **Ramesh Kumar** joins an 11-month scheme:

- You enter: **Name**, **Mobile**, **Scheme: 11 months**, **Monthly EMI: ₹5,000**, **Start date: 1 Jan 2026**.
- The app **automatically** creates 11 installments with due dates (1 Jan, 1 Feb, … 1 Nov).
- No manual calculation.

### 2. Automatic reminders

- **2 days before** due date and **on due date**, the app can show a **notification** (e.g. *“Dear Ramesh Ji, your EMI of ₹5,000 is due on 1 February. Kindly make the payment. Thank you.”*).
- SMS/WhatsApp reminders can be added later via a backend (Twilio / WhatsApp Business API).

### 3. Record payment → Receipt

- On **1 February** Ramesh pays ₹5,000.
- You tap **Record Payment** → **Single EMI** → **Confirm**.
- The app:
  - Marks that installment **Paid**.
  - Shows **Total paid** and **Remaining**.
  - Opens a **digital receipt** you can **Share** (e.g. to WhatsApp).

### 4. If customer pays extra (e.g. ₹10,000 in one month)

- You tap **Record Payment** → **Pay extra this month**.
- Enter amount (e.g. **10000**) and choose:
  - **Adjust in last EMI** – extra reduces the last installment.
  - **Reduce future monthly EMI** – remaining balance is spread over fewer/same months with lower EMI.
  - **Reduce duration** – finish the scheme earlier.
- The app applies the chosen option and updates the schedule.

### 5. Change scheme (e.g. 5 months → 11 months)

- Customer had **5 months**, paid **2**, remaining **₹30,000**.
- You tap **Record Payment** → **Change scheme**.
- Enter **remaining months** (e.g. **9** for 11−2).
- New EMI = ₹30,000 ÷ 9 ≈ **₹3,333/month**. The app regenerates the remaining installments.

### 6. Skip one month, pay double later

- April not paid, May customer pays **₹10,000**.
- You tap **Record Payment** → **Pay multiple**.
- Enter **10000**. The app marks **April** and **May** as paid (no manual tracking).

### 7. Early closure (full settlement)

- Customer wants to close the scheme early.
- You tap **Record Payment** → **Full settlement**.
- The app shows remaining amount; you confirm and it marks all remaining installments paid and the scheme **Completed**.

### 8. Owner dashboard

- **Active customers**
- **Expected this month** vs **Collected this month**
- **Pending** and **Overdue** count and amount
- **Overdue customers** list (name, amount, due date)

---

## Features included

| Feature | Status |
|--------|--------|
| Customer management (name, mobile, address, 5/11 month scheme, start date, EMI) | ✅ |
| Auto 5/11 installment schedule | ✅ |
| Paid / Pending / Overdue status (with overdue auto-update) | ✅ |
| Record payment: single, extra (3 options), multiple, scheme change, full settlement | ✅ |
| Digital receipt + Share (e.g. WhatsApp) | ✅ |
| Dashboard (expected, collected, pending, overdue) | ✅ |
| In-app reminder notifications (2 days before + on due date) | ✅ |
| Data stored on device (AsyncStorage); ready to plug in cloud later | ✅ |

---

## Optional (for later)

- SMS/WhatsApp reminders (backend + API)
- PDF receipt download
- Customer login to see their EMI status
- UPI/QR payment
- Multi-branch and GST

---

## Tech stack

- **Expo (React Native)** – one codebase for iOS and Android
- **TypeScript**
- **React Navigation** (tabs + stack)
- **expo-sqlite** – local SQLite database for customers, installments, user, and key-value data
- **expo-notifications** for reminders

## Database

The app uses **SQLite** (`expo-sqlite`) with:

- **Tables:** `user`, `customer`, `installment`, `key_value`
- **WAL mode** and **foreign keys** enabled
- **One-time migration** from AsyncStorage on first run (if you had data from the previous version, it is copied into SQLite automatically)

Data is stored only on the device. For backup and multi-device sync, you can add a cloud backend (e.g. Firebase/Supabase) and sync with the same schema.
