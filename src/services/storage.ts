/**
 * Storage API for Ganesh Jewellers.
 * Uses SQLite database (see database.ts). Exports the same interface for compatibility.
 */

export {
  getCustomers,
  getCustomer,
  addCustomer,
  updateCustomer,
  deleteCustomer,
  getUser,
  saveUser,
  getLoggedInCustomerId,
  saveLoggedInCustomerId,
  getReminderDueDates,
  setReminderDueDates,
  getMinimumAmount,
  setMinimumAmount,
  getSchemes,
  getAllSchemes,
  addScheme,
  updateScheme,
  deleteScheme,
  getPaymentApiUrl,
  setPaymentApiUrl,
} from './database';
