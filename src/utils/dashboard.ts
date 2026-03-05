import type { Customer, DashboardStats } from '../types';
import { getTotalPaid, getRemainingBalance, updateOverdueStatus } from './emiLogic';

function toMonthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Normalize dueDate to YYYY-MM for comparison (handles YYYY-MM-DD or legacy malformed strings) */
function toInstMonth(dueDate: string | undefined): string {
  if (!dueDate || typeof dueDate !== 'string') return '';
  const match = dueDate.match(/^(\d{4})-(\d{2})/);
  return match ? `${match[1]}-${match[2]}` : '';
}

export function computeDashboardStats(customers: Customer[]): DashboardStats {
  const active = customers.filter((c) => c.status === 'active');
  const now = new Date();
  const thisMonth = toMonthKey(now);

  let expectedThisMonth = 0;
  let collectedThisMonth = 0;
  let overdueCount = 0;
  let overdueAmount = 0;

  active.forEach((c) => {
    const raw = c.installments ?? [];
    const installments = updateOverdueStatus(raw);
    installments.forEach((inst) => {
      const instMonth = toInstMonth(inst.dueDate);
      if (instMonth && instMonth === thisMonth) {
        expectedThisMonth += inst.amount ?? 0;
        if (inst.status === 'paid') collectedThisMonth += inst.paidAmount ?? inst.amount ?? 0;
      }
      if (inst.status === 'overdue') {
        overdueCount++;
        overdueAmount += inst.amount ?? 0;
      }
    });
  });

  return {
    activeCustomers: active.length,
    expectedThisMonth,
    collectedThisMonth,
    pendingThisMonth: expectedThisMonth - collectedThisMonth,
    overdueCount,
    overdueAmount,
  };
}

export function getOverdueCustomers(customers: Customer[]): Customer[] {
  return customers
    .filter((c) => c.status === 'active')
    .map((c) => ({
      ...c,
      installments: updateOverdueStatus(c.installments ?? []),
    }))
    .filter((c) => c.installments.some((i) => i.status === 'overdue'));
}
