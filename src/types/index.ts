// Ganesh Jewellers EMI App - Data Models

export type SchemeType = 5 | 11; // kept for backward compat; use Scheme.id for new data

export type InstallmentStatus = 'pending' | 'paid' | 'overdue';

export interface Installment {
  id: string;
  monthNumber: number;
  dueDate: string;
  amount: number;
  status: InstallmentStatus;
  paidDate?: string;
  paidAmount?: number;
  note?: string;
}

export type ExtraPaymentOption = 'adjust_last' | 'reduce_emi' | 'reduce_duration';

export type DocumentStatus = 'pending' | 'verified' | 'rejected';

export interface Scheme {
  id: string;
  name: string;
  months: number;
  isActive: boolean;
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  address?: string;
  idProofUrl?: string;
  /** Auto-generated PIN; sent to customer via WhatsApp */
  customerPin?: string;
  schemeType: SchemeType;
  monthlyEmiAmount: number;
  startDate: string;
  installments: Installment[];
  status: 'active' | 'completed' | 'closed';
  completedDate?: string;
  createdAt: string;
  updatedAt: string;
  /** Document verification – owner & customer can see */
  documentStatus?: DocumentStatus;
  documentVerifiedAt?: string;
  documentVerifiedBy?: string;
  /** Auto-pay preference */
  autoPayEnabled?: boolean;
  /** Optional link to scheme (for display name) */
  schemeId?: string;
}

export interface User {
  id: string;
  name: string;
  role: 'owner' | 'staff';
  pin?: string;
}

export interface ReceiptData {
  id: string;
  customerId: string;
  customerName: string;
  date: string;
  amount: number;
  installmentNumbers: number[];
  remainingBalance: number;
  totalPaid: number;
}

export interface DashboardStats {
  activeCustomers: number;
  expectedThisMonth: number;
  collectedThisMonth: number;
  pendingThisMonth: number;
  overdueCount: number;
  overdueAmount: number;
}
