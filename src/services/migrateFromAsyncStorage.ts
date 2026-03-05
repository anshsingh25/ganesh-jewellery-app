/**
 * One-time migration: copy data from AsyncStorage to SQLite so existing users don't lose data.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Customer, User } from '../types';
import { getDb } from './db';
import * as db from './database';

const CUSTOMERS_KEY = '@ganesh_jewellers_customers';
const USER_KEY = '@ganesh_jewellers_user';
const LOGGED_IN_CUSTOMER_ID_KEY = '@ganesh_jewellers_logged_in_customer_id';

export async function migrateIfNeeded(): Promise<void> {
  const database = getDb();
  const existing = await database.getFirstAsync<{ n: number }>('SELECT COUNT(*) as n FROM customer');
  if (existing && existing.n > 0) return; // Already have data in SQLite

  try {
    const [customersRaw, userRaw, customerIdRaw] = await Promise.all([
      AsyncStorage.getItem(CUSTOMERS_KEY),
      AsyncStorage.getItem(USER_KEY),
      AsyncStorage.getItem(LOGGED_IN_CUSTOMER_ID_KEY),
    ]);

    if (customersRaw) {
      const list: Customer[] = JSON.parse(customersRaw);
      if (Array.isArray(list)) {
        for (const c of list) {
          await db.addCustomer(c);
        }
      }
    }

    if (userRaw) {
      const user: User = JSON.parse(userRaw);
      await db.saveUser(user);
    }

    if (customerIdRaw) {
      await db.saveLoggedInCustomerId(customerIdRaw);
    }
  } catch (_) {
    // Ignore migration errors (e.g. no AsyncStorage data)
  }
}
