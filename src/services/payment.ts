/**
 * Payment flow via Razorpay (UPI, cards, etc.)
 * Uses backend to create order and verify; opens checkout in browser.
 */

import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

export interface PendingPayment {
  orderId: string;
  customerId: string;
  installmentId: string;
  amount: number;
  monthNumber: number;
  customerName: string;
}

let pendingPayment: PendingPayment | null = null;

export function setPendingPayment(p: PendingPayment | null): void {
  pendingPayment = p;
}

export function getPendingPayment(): PendingPayment | null {
  return pendingPayment;
}

export function clearPendingPayment(): void {
  pendingPayment = null;
}

const APP_SCHEME = 'ganeshjewellers';

export async function createOrder(
  apiBaseUrl: string,
  amount: number,
  customerId: string,
  installmentId: string,
  customerName: string
): Promise<{ orderId: string; keyId: string }> {
  const url = apiBaseUrl.replace(/\/$/, '') + '/api/create-order';
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount,
      currency: 'INR',
      receipt: `emi-${Date.now()}`,
      customerId,
      installmentId,
      customerName,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Server error ${res.status}`);
  }
  const data = await res.json();
  return { orderId: data.orderId, keyId: data.keyId };
}

export async function openCheckout(apiBaseUrl: string, orderId: string, keyId: string): Promise<void> {
  const base = apiBaseUrl.replace(/\/$/, '');
  const checkoutUrl = `${base}/checkout?order_id=${encodeURIComponent(orderId)}&key_id=${encodeURIComponent(keyId)}&redirect_scheme=${APP_SCHEME}`;
  await WebBrowser.openBrowserAsync(checkoutUrl, {
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
  });
}

export async function verifyPayment(
  apiBaseUrl: string,
  orderId: string,
  paymentId: string,
  signature: string
): Promise<boolean> {
  const url = apiBaseUrl.replace(/\/$/, '') + '/api/verify-payment';
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, paymentId, signature }),
  });
  if (!res.ok) return false;
  const data = await res.json();
  return data.success === true;
}

export function getPaymentSuccessUrl(): string {
  return `${APP_SCHEME}://payment/success`;
}

export function parsePaymentSuccessUrl(url: string): { orderId: string; paymentId: string; signature: string } | null {
  if (!url || !url.includes(APP_SCHEME + '://payment/success')) return null;
  try {
    const u = new URL(url);
    const orderId = u.searchParams.get('order_id');
    const paymentId = u.searchParams.get('payment_id');
    const signature = u.searchParams.get('signature');
    if (orderId && paymentId && signature) return { orderId, paymentId, signature };
  } catch (_) {}
  return null;
}
