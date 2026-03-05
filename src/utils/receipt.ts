import type { Customer, Installment } from '../types';
import { getTotalPaid, getRemainingBalance } from './emiLogic';

export function generateReceiptText(
  customer: { name: string; mobile: string; installments: Installment[] },
  paidAmount: number,
  installmentNumbers: number[],
  paidDate: string
): string {
  const totalPaid = getTotalPaid(customer.installments);
  const remaining = getRemainingBalance(customer.installments);

  return [
    '═══════════════════════',
    '   GANESH JEWELLERS',
    '   EMI Receipt',
    '═══════════════════════',
    '',
    `Date: ${paidDate}`,
    `Customer: ${customer.name}`,
    `Mobile: ${customer.mobile}`,
    '',
    `Amount paid: ₹${paidAmount.toLocaleString('en-IN')}`,
    `For month(s): ${installmentNumbers.join(', ')}`,
    '',
    `Total paid: ₹${totalPaid.toLocaleString('en-IN')}`,
    `Remaining: ₹${remaining.toLocaleString('en-IN')}`,
    '',
    'Thank you for your payment.',
    '— Ganesh Jewellers 🙏',
    '═══════════════════════',
  ].join('\n');
}

export function getReminderMessage(customer: Customer, nextDue: Installment): string {
  return [
    `Dear ${customer.name}, your EMI of ₹${nextDue.amount.toLocaleString('en-IN')} for Ganesh Jewellers is due on ${nextDue.dueDate}. Kindly make the payment. Thank you 🙏`,
  ].join('\n');
}
