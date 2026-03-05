/** Generate a 6-digit numeric PIN for customer login */
export function generateCustomerPin(): string {
  const n = Math.floor(100000 + Math.random() * 900000);
  return String(n);
}
