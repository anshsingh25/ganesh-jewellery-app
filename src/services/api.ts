/**
 * API client for Ganesh Jewellers backend (MySQL).
 * Used when Server URL is configured in Settings.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Customer, User, Scheme, LiveRatesData, LiveRateBuySell, LiveRateBidAsk } from '../types';

const TOKEN_KEY = '@ganesh_auth_token';
const OWNER_TOKEN_KEY = '@ganesh_owner_token';
const CUSTOMER_TOKEN_KEY = '@ganesh_customer_token';

export async function getOwnerToken(): Promise<string | null> {
  return AsyncStorage.getItem(OWNER_TOKEN_KEY);
}

export async function setOwnerToken(token: string | null): Promise<void> {
  if (token) {
    await AsyncStorage.setItem(OWNER_TOKEN_KEY, token);
    await AsyncStorage.removeItem(CUSTOMER_TOKEN_KEY);
  } else {
    await AsyncStorage.removeItem(OWNER_TOKEN_KEY);
  }
}

export async function getCustomerToken(): Promise<string | null> {
  return AsyncStorage.getItem(CUSTOMER_TOKEN_KEY);
}

export async function setCustomerToken(token: string | null): Promise<void> {
  if (token) {
    await AsyncStorage.setItem(CUSTOMER_TOKEN_KEY, token);
    await AsyncStorage.removeItem(OWNER_TOKEN_KEY);
  } else {
    await AsyncStorage.removeItem(CUSTOMER_TOKEN_KEY);
  }
}

async function request<T>(
  baseUrl: string,
  token: string | null,
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const base = baseUrl.replace(/\/$/, '');
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body != null ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const text = await res.text();
    let data: T;
    try {
      data = text ? (JSON.parse(text) as T) : ({} as T);
    } catch {
      throw new Error(res.ok ? 'Invalid response' : text || res.statusText);
    }

    if (!res.ok) {
      const err = (data as { error?: string })?.error || res.statusText || 'Request failed';
      throw new Error(err);
    }
    return data;
  } catch (e: unknown) {
    clearTimeout(timeoutId);
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === 'Network request failed' || msg === 'AbortError' || (e instanceof TypeError && msg.includes('fetch'))) {
      throw new Error(
        'Cannot reach server. Check: (1) Server URL uses https:// (e.g. https://your-app.up.railway.app), (2) device has internet, (3) server is running.'
      );
    }
    throw e;
  }
}

// Auth
export async function ownerLogin(
  baseUrl: string,
  name: string,
  pin: string
): Promise<{ token: string; user: User }> {
  const { token, user } = await request<{ token: string; user: User }>(
    baseUrl,
    null,
    'POST',
    '/api/auth/owner-login',
    { name, pin }
  );
  return { token, user };
}

export async function customerLogin(
  baseUrl: string,
  mobile: string,
  pin: string
): Promise<{ token: string; customer: Customer }> {
  const { token, customer } = await request<{ token: string; customer: Customer }>(
    baseUrl,
    null,
    'POST',
    '/api/auth/customer-login',
    { mobile, pin }
  );
  return { token, customer };
}

// Customers
export async function getCustomers(baseUrl: string, token: string): Promise<Customer[]> {
  return request<Customer[]>(baseUrl, token, 'GET', '/api/customers');
}

export async function getCustomer(baseUrl: string, token: string, id: string): Promise<Customer | null> {
  try {
    return await request<Customer>(baseUrl, token, 'GET', `/api/customers/${id}`);
  } catch {
    return null;
  }
}

export async function addCustomer(baseUrl: string, token: string, customer: Customer): Promise<void> {
  await request(baseUrl, token, 'POST', '/api/customers', customer);
}

export async function updateCustomer(baseUrl: string, token: string, customer: Customer): Promise<void> {
  await request(baseUrl, token, 'PUT', `/api/customers/${customer.id}`, customer);
}

export async function deleteCustomer(baseUrl: string, token: string, id: string): Promise<void> {
  await request(baseUrl, token, 'DELETE', `/api/customers/${id}`);
}

// Customer self-service (GET /api/me, PUT /api/me)
export async function getMe(baseUrl: string, token: string): Promise<Customer> {
  return request<Customer>(baseUrl, token, 'GET', '/api/me');
}

export async function updateMe(baseUrl: string, token: string, customer: Customer): Promise<void> {
  await request(baseUrl, token, 'PUT', '/api/me', customer);
}

// Schemes
export async function getSchemes(baseUrl: string, token: string): Promise<Scheme[]> {
  return request<Scheme[]>(baseUrl, token, 'GET', '/api/schemes');
}

export async function getAllSchemes(baseUrl: string, token: string): Promise<Scheme[]> {
  return request<Scheme[]>(baseUrl, token, 'GET', '/api/schemes/all');
}

export async function addScheme(baseUrl: string, token: string, scheme: Scheme): Promise<void> {
  await request(baseUrl, token, 'POST', '/api/schemes', scheme);
}

export async function updateScheme(baseUrl: string, token: string, scheme: Scheme): Promise<void> {
  await request(baseUrl, token, 'PUT', `/api/schemes/${scheme.id}`, scheme);
}

export async function deleteScheme(baseUrl: string, token: string, id: string): Promise<void> {
  await request(baseUrl, token, 'DELETE', `/api/schemes/${id}`);
}

// Settings
export async function getMinimumAmount(baseUrl: string, token: string): Promise<number> {
  const { value } = await request<{ value: number }>(baseUrl, token, 'GET', '/api/settings/min-amount');
  return value ?? 0;
}

export async function setMinimumAmount(baseUrl: string, token: string, amount: number): Promise<void> {
  await request(baseUrl, token, 'PUT', '/api/settings/min-amount', { value: amount });
}

// Server URL (payment-url) – save on server so it can be synced across devices
export async function getServerUrlFromServer(baseUrl: string, token: string): Promise<string> {
  const { value } = await request<{ value: string }>(baseUrl, token, 'GET', '/api/settings/payment-url');
  return value?.trim() || '';
}

export async function setServerUrlOnServer(baseUrl: string, token: string, url: string): Promise<void> {
  await request(baseUrl, token, 'PUT', '/api/settings/payment-url', { value: url.trim() });
}

export async function getLiveRates(baseUrl: string): Promise<LiveRatesData> {
  const base = baseUrl.replace(/\/$/, '');
  const url = `${base}/api/live-rates`;
  const res = await fetch(url, { method: 'GET' });
  const text = await res.text();
  const data = text ? JSON.parse(text) : { buySell: [], bidAsk: [] };
  if (!res.ok) throw new Error((data as { error?: string })?.error || res.statusText);
  return data;
}

export async function addLiveRateBuySell(
  baseUrl: string,
  token: string,
  item: { product: string; buyValue?: string; sellValue: string; sortOrder?: number }
): Promise<LiveRateBuySell> {
  return request<LiveRateBuySell>(baseUrl, token, 'POST', '/api/live-rates/buy-sell', item);
}

export async function addLiveRateBidAsk(
  baseUrl: string,
  token: string,
  item: { product: string; bid?: string; ask?: string; high?: string; low?: string; sortOrder?: number }
): Promise<LiveRateBidAsk> {
  return request<LiveRateBidAsk>(baseUrl, token, 'POST', '/api/live-rates/bid-ask', item);
}

export async function updateLiveRateBuySell(
  baseUrl: string,
  token: string,
  id: string,
  item: Partial<{ product: string; buyValue: string; sellValue: string; sortOrder: number }>
): Promise<LiveRateBuySell> {
  return request<LiveRateBuySell>(baseUrl, token, 'PUT', `/api/live-rates/buy-sell/${id}`, item);
}

export async function updateLiveRateBidAsk(
  baseUrl: string,
  token: string,
  id: string,
  item: Partial<{ product: string; bid: string; ask: string; high: string; low: string; sortOrder: number }>
): Promise<LiveRateBidAsk> {
  return request<LiveRateBidAsk>(baseUrl, token, 'PUT', `/api/live-rates/bid-ask/${id}`, item);
}

export async function deleteLiveRateBuySell(baseUrl: string, token: string, id: string): Promise<void> {
  await request(baseUrl, token, 'DELETE', `/api/live-rates/buy-sell/${id}`);
}

export async function deleteLiveRateBidAsk(baseUrl: string, token: string, id: string): Promise<void> {
  await request(baseUrl, token, 'DELETE', `/api/live-rates/bid-ask/${id}`);
}
