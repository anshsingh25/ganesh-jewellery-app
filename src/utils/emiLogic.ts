/**
 * Ganesh Jewellers - EMI calculation and schedule logic
 * Handles 5-month and 11-month schemes, extra payments, scheme change, early closure.
 */

import type { Customer, Installment, SchemeType, ExtraPaymentOption } from '../types';

const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function generateInstallments(
  schemeType: SchemeType,
  monthlyAmount: number,
  startDate: string
): Installment[] {
  const list: Installment[] = [];
  for (let i = 0; i < schemeType; i++) {
    list.push({
      id: `inst-${Date.now()}-${i}`,
      monthNumber: i + 1,
      dueDate: addMonths(startDate, i),
      amount: monthlyAmount,
      status: 'pending',
    });
  }
  return list;
}

export function getTotalSchemeAmount(schemeType: SchemeType, monthlyAmount: number): number {
  return schemeType * monthlyAmount;
}

export function getPaidInstallments(installments: Installment[]): Installment[] {
  return installments.filter((i) => i.status === 'paid');
}

export function getPendingInstallments(installments: Installment[]): Installment[] {
  return installments.filter((i) => i.status === 'pending' || i.status === 'overdue');
}

export function getTotalPaid(installments: Installment[]): number {
  return installments
    .filter((i) => i.status === 'paid')
    .reduce((sum, i) => sum + (i.paidAmount ?? i.amount), 0);
}

export function getRemainingBalance(installments: Installment[]): number {
  const pending = installments.filter((i) => i.status !== 'paid');
  return pending.reduce((sum, i) => sum + i.amount, 0);
}

export function updateOverdueStatus(installments: Installment[]): Installment[] {
  const today = toDateStr(new Date());
  return installments.map((inst) => {
    if (inst.status !== 'pending') return inst;
    return {
      ...inst,
      status: inst.dueDate < today ? 'overdue' : 'pending',
    };
  });
}

/** Mark single installment as paid (normal payment). */
export function markInstallmentPaid(
  installments: Installment[],
  installmentId: string,
  paidAmount?: number,
  paidDate?: string
): Installment[] {
  const date = paidDate || toDateStr(new Date());
  return installments.map((i) =>
    i.id === installmentId
      ? {
          ...i,
          status: 'paid' as const,
          paidDate: date,
          paidAmount: paidAmount ?? i.amount,
        }
      : i
  );
}

/** Find next unpaid installment (by due date). */
export function getNextUnpaidInstallment(installments: Installment[]): Installment | null {
  const unpaid = installments
    .filter((i) => i.status !== 'paid')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  return unpaid[0] ?? null;
}

/**
 * Handle extra payment: customer pays more than one EMI.
 * Option A: Adjust in last EMI
 * Option B: Reduce future monthly EMI
 * Option C: Reduce duration (finish early)
 */
export function applyExtraPayment(
  installments: Installment[],
  amountPaid: number,
  option: ExtraPaymentOption,
  paidDate?: string
): Installment[] {
  const date = paidDate || toDateStr(new Date());
  let remaining = amountPaid;
  const result = [...installments];

  // Pay off installments in order until money runs out
  for (let i = 0; i < result.length && remaining > 0; i++) {
    if (result[i].status === 'paid') continue;
    const need = result[i].amount;
    if (remaining >= need) {
      result[i] = {
        ...result[i],
        status: 'paid',
        paidDate: date,
        paidAmount: need,
      };
      remaining -= need;
    } else {
      // Partial payment for this installment
      result[i] = {
        ...result[i],
        status: 'paid',
        paidDate: date,
        paidAmount: remaining,
        note: `Partial: ₹${remaining}, balance adjusted`,
      };
      remaining = 0;
    }
  }

  if (remaining <= 0) return result;

  // We have extra after paying all pending - apply based on option
  if (option === 'adjust_last') {
    const lastIndex = result.length - 1;
    if (result[lastIndex].status !== 'paid') {
      const newAmount = Math.max(0, result[lastIndex].amount - remaining);
      result[lastIndex] = {
        ...result[lastIndex],
        amount: newAmount,
        note: result[lastIndex].note
          ? `${result[lastIndex].note}; Adjusted by ₹${remaining}`
          : `Adjusted by ₹${remaining}`,
      };
    }
  } else if (option === 'reduce_emi') {
    const unpaid = result.filter((i) => i.status !== 'paid');
    if (unpaid.length > 0) {
      const totalRemaining = unpaid.reduce((s, i) => s + i.amount, 0);
      const newMonthly = (totalRemaining - remaining) / unpaid.length;
      unpaid.forEach((inst, idx) => {
        const i = result.findIndex((r) => r.id === inst.id);
        if (i !== -1) result[i] = { ...result[i], amount: Math.round(newMonthly) };
      });
    }
  } else if (option === 'reduce_duration') {
    // Extra amount reduces principal; we don't remove installments but could mark earlier completion
    // For simplicity we treat as "adjust last" when extra remains
    const lastIndex = result.length - 1;
    if (result[lastIndex].status !== 'paid') {
      result[lastIndex] = {
        ...result[lastIndex],
        amount: Math.max(0, result[lastIndex].amount - remaining),
        note: `Reduced by ₹${remaining} (early closure)`,
      };
    }
  }

  return result;
}

/**
 * Customer pays for multiple months at once (e.g. skipped April, pays double in May).
 * Mark next N installments as paid for the amount given.
 */
export function markMultipleInstallmentsPaid(
  installments: Installment[],
  amountPaid: number,
  paidDate?: string
): Installment[] {
  const date = paidDate || toDateStr(new Date());
  let remaining = amountPaid;
  const result = [...installments];

  for (let i = 0; i < result.length && remaining > 0; i++) {
    if (result[i].status === 'paid') continue;
    const need = result[i].amount;
    if (remaining >= need) {
      result[i] = {
        ...result[i],
        status: 'paid',
        paidDate: date,
        paidAmount: need,
      };
      remaining -= need;
    } else {
      result[i] = {
        ...result[i],
        status: 'paid',
        paidDate: date,
        paidAmount: remaining,
        note: `Partial ₹${remaining}`,
      };
      remaining = 0;
    }
  }
  return result;
}

/**
 * Change scheme (e.g. 5 months → 11 months).
 * Recalculate remaining amount over new number of months.
 * Example: 5-month scheme, paid 2 months, remaining ₹30,000 → spread over 9 months = ₹3,333/month.
 */
export function changeScheme(
  installments: Installment[],
  newRemainingMonths: number
): Installment[] {
  const paid = installments.filter((i) => i.status === 'paid');
  const pending = installments.filter((i) => i.status !== 'paid');
  const remainingAmount = pending.reduce((s, i) => s + i.amount, 0);
  const lastDueDate =
    pending.length > 0
      ? pending.sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0].dueDate
      : installments[installments.length - 1]?.dueDate ?? toDateStr(new Date());

  const paidCount = paid.length;
  const newMonthlyAmount = Math.ceil(remainingAmount / newRemainingMonths);
  const newInstallments: Installment[] = [];

  for (let i = 0; i < newRemainingMonths; i++) {
    const dueDate = addMonths(lastDueDate, i);
    const amount =
      i === newRemainingMonths - 1
        ? remainingAmount - newMonthlyAmount * (newRemainingMonths - 1)
        : newMonthlyAmount;
    newInstallments.push({
      id: `inst-${Date.now()}-${i}`,
      monthNumber: paidCount + i + 1,
      dueDate,
      amount,
      status: 'pending',
    });
  }

  return [...paid, ...newInstallments];
}

/**
 * Early closure: pay full remaining balance. Mark scheme completed.
 */
export function getEarlyClosureAmount(installments: Installment[]): number {
  return getRemainingBalance(installments);
}

export function markSchemeClosed(installments: Installment[], paidDate?: string): Installment[] {
  const date = paidDate || toDateStr(new Date());
  const remaining = getRemainingBalance(installments);
  return markMultipleInstallmentsPaid(installments, remaining, date);
}
