import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Switch,
} from 'react-native';
import type { Customer, Installment, ExtraPaymentOption } from '../types';
import { useApp } from '../context/AppContext';
import { useSyncedStorage } from '../hooks/useSyncedStorage';
import {
  getTotalPaid,
  getRemainingBalance,
  updateOverdueStatus,
  markInstallmentPaid,
  applyExtraPayment,
  markMultipleInstallmentsPaid,
  changeScheme,
  getEarlyClosureAmount,
  markSchemeClosed,
} from '../utils/emiLogic';
import RecordPaymentModal from '../components/RecordPaymentModal';
import ReceiptModal from '../components/ReceiptModal';
import { generateReceiptText } from '../utils/receipt';
import { theme } from '../theme';

function InstallmentRow({ inst }: { inst: Installment }) {
  const isPaid = inst.status === 'paid';
  const isOverdue = inst.status === 'overdue';
  const color = isPaid ? theme.colors.paid : isOverdue ? theme.colors.overdue : theme.colors.pending;
  return (
    <View style={[styles.instRow, { borderLeftColor: color }]}>
      <Text style={styles.instMonth}>Month {inst.monthNumber}</Text>
      <Text style={styles.instDue}>{inst.dueDate}</Text>
      <Text style={[styles.instAmount, { color }]}>
        ₹{inst.amount}
        {inst.paidAmount != null && inst.paidAmount !== inst.amount && ` (paid ${inst.paidAmount})`}
      </Text>
      <Text style={[styles.instStatus, { color }]}>
        {inst.status === 'paid' ? '✅ Paid' : inst.status === 'overdue' ? '🔴 Overdue' : 'Pending'}
      </Text>
    </View>
  );
}

export default function CustomerDetailScreen({ route, navigation }: any) {
  const { customerId } = route.params;
  const { user, customers, updateCustomer } = useApp();
  const { getMinimumAmount } = useSyncedStorage();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [receiptText, setReceiptText] = useState<string | null>(null);
  const [minimumAmount, setMinimumAmount] = useState(0);

  useEffect(() => {
    getMinimumAmount().then(setMinimumAmount);
  }, [getMinimumAmount]);

  const customer = customers.find((c) => c.id === customerId);
  if (!customer) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>Customer not found.</Text>
      </View>
    );
  }

  const installments = updateOverdueStatus(customer.installments);
  const totalPaid = getTotalPaid(installments);
  const remaining = getRemainingBalance(installments);
  const allPaid = installments.every((i) => i.status === 'paid');

  const handlePaymentRecorded = async (
    updatedInstallments: Installment[],
    receiptInfo?: { paidAmount: number; installmentNumbers: number[] }
  ) => {
    const updated: Customer = {
      ...customer,
      installments: updatedInstallments,
      status: updatedInstallments.every((i) => i.status === 'paid') ? 'completed' : 'active',
      completedDate: updatedInstallments.every((i) => i.status === 'paid')
        ? new Date().toISOString().slice(0, 10)
        : undefined,
    };
    await updateCustomer(updated);
    setShowPaymentModal(false);
    if (receiptInfo) {
      const text = generateReceiptText(
        { ...customer, installments: updatedInstallments },
        receiptInfo.paidAmount,
        receiptInfo.installmentNumbers,
        new Date().toISOString().slice(0, 10)
      );
      setReceiptText(text);
    }
  };

  const handleRecordPayment = (
    amount: number,
    mode: 'single' | 'extra' | 'multiple',
    option?: ExtraPaymentOption
  ) => {
    let next = installments;
    let receiptInfo: { paidAmount: number; installmentNumbers: number[] } | undefined;
    const paidDate = new Date().toISOString().slice(0, 10);

    if (mode === 'single') {
      const firstPending = installments.find((i) => i.status !== 'paid');
      if (firstPending) {
        next = markInstallmentPaid(installments, firstPending.id, amount);
        receiptInfo = { paidAmount: amount, installmentNumbers: [firstPending.monthNumber] };
      }
    } else if (mode === 'extra' && option) {
      next = applyExtraPayment(installments, amount, option);
      const newlyPaid = next.filter((i) => i.paidDate === paidDate);
      receiptInfo = {
        paidAmount: amount,
        installmentNumbers: newlyPaid.map((i) => i.monthNumber),
      };
    } else if (mode === 'multiple') {
      next = markMultipleInstallmentsPaid(installments, amount);
      const newlyPaid = next.filter((i) => i.paidDate === paidDate);
      receiptInfo = {
        paidAmount: amount,
        installmentNumbers: newlyPaid.map((i) => i.monthNumber),
      };
    }
    handlePaymentRecorded(next, receiptInfo);
  };

  const handleSchemeChange = (newRemainingMonths: number) => {
    const next = changeScheme(installments, newRemainingMonths);
    handlePaymentRecorded(next);
  };

  const handleEarlyClose = () => {
    const next = markSchemeClosed(installments);
    const paidDate = new Date().toISOString().slice(0, 10);
    const newlyPaid = next.filter((i) => i.paidDate === paidDate);
    handlePaymentRecorded(next, {
      paidAmount: getEarlyClosureAmount(installments),
      installmentNumbers: newlyPaid.map((i) => i.monthNumber),
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.name}>{customer.name}</Text>
        <Text style={styles.mobile}>{customer.mobile}</Text>
        {customer.address ? <Text style={styles.address}>{customer.address}</Text> : null}
        <Text style={styles.scheme}>
          {customer.schemeType} months • ₹{customer.monthlyEmiAmount}/month
        </Text>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => navigation.navigate('EditCustomer', { customerId: customer.id })}
        >
          <Text style={styles.editBtnText}>Edit customer</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.docSection}>
        <Text style={styles.docLabel}>Document verification</Text>
        <Text style={styles.docStatus}>
          Status: {customer.documentStatus === 'verified' ? '✅ Verified' : customer.documentStatus === 'rejected' ? '❌ Rejected' : '⏳ Pending'}
        </Text>
        {customer.documentVerifiedAt && (
          <Text style={styles.docMeta}>
            {customer.documentVerifiedBy && `By ${customer.documentVerifiedBy} • `}{customer.documentVerifiedAt}
          </Text>
        )}
        {(customer.documentStatus === 'pending' || customer.documentStatus === undefined) && (
          <View style={styles.docActions}>
            <TouchableOpacity
              style={[styles.docBtn, styles.verifyBtn]}
              onPress={() => {
                const updated: Customer = {
                  ...customer,
                  documentStatus: 'verified',
                  documentVerifiedAt: new Date().toISOString().slice(0, 10),
                  documentVerifiedBy: user?.name ?? 'Owner',
                };
                updateCustomer(updated);
              }}
            >
              <Text style={styles.docBtnText}>Verify</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.docBtn, styles.rejectBtn]}
              onPress={() => {
                const updated: Customer = {
                  ...customer,
                  documentStatus: 'rejected',
                  documentVerifiedAt: new Date().toISOString().slice(0, 10),
                  documentVerifiedBy: user?.name ?? 'Owner',
                };
                updateCustomer(updated);
              }}
            >
              <Text style={styles.docBtnText}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.autoPayRow}>
        <Text style={styles.autoPayLabel}>Auto-pay</Text>
        <Switch
          value={!!customer.autoPayEnabled}
          onValueChange={(v) => updateCustomer({ ...customer, autoPayEnabled: v })}
          trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
          thumbColor="#fff"
        />
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total paid</Text>
          <Text style={[styles.summaryValue, { color: theme.colors.paid }]}>
            ₹{totalPaid.toLocaleString('en-IN')}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Remaining</Text>
          <Text style={[styles.summaryValue, { color: theme.colors.pending }]}>
            ₹{remaining.toLocaleString('en-IN')}
          </Text>
        </View>
      </View>

      {!allPaid && (
        <TouchableOpacity
          style={styles.recordButton}
          onPress={() => setShowPaymentModal(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.recordButtonText}>Record Payment</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.instTitle}>Installments</Text>
      {installments.map((inst) => (
        <InstallmentRow key={inst.id} inst={inst} />
      ))}

      <RecordPaymentModal
        visible={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        customer={customer}
        installments={installments}
        remainingBalance={remaining}
        minimumAmount={minimumAmount}
        onRecordSingle={(amount) => handleRecordPayment(amount, 'single')}
        onRecordExtra={(amount, option) => handleRecordPayment(amount, 'extra', option)}
        onRecordMultiple={(amount) => handleRecordPayment(amount, 'multiple')}
        onChangeScheme={handleSchemeChange}
        onEarlyClose={handleEarlyClose}
      />
      <ReceiptModal
        visible={receiptText !== null}
        receiptText={receiptText ?? ''}
        onClose={() => setReceiptText(null)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.lg, paddingBottom: 40 },
  error: { padding: theme.spacing.lg, color: theme.colors.pending },
  header: { marginBottom: theme.spacing.lg },
  name: { ...theme.typography.title, color: theme.colors.text },
  mobile: { ...theme.typography.body, color: theme.colors.textSecondary, marginTop: 4 },
  address: { ...theme.typography.caption, color: theme.colors.textSecondary, marginTop: 2 },
  scheme: { ...theme.typography.caption, color: theme.colors.primary, marginTop: 4 },
  editBtn: { marginTop: 8, alignSelf: 'flex-start' },
  editBtnText: { ...theme.typography.body, color: theme.colors.primary, fontWeight: '600' },
  docSection: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
    ...theme.shadows.sm,
  },
  docLabel: { ...theme.typography.caption, color: theme.colors.textSecondary },
  docStatus: { ...theme.typography.body, marginTop: 4 },
  docMeta: { ...theme.typography.caption, color: theme.colors.textSecondary, marginTop: 2 },
  docActions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  docBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: theme.radius.sm },
  verifyBtn: { backgroundColor: theme.colors.paid },
  rejectBtn: { backgroundColor: theme.colors.overdue },
  docBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  autoPayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  autoPayLabel: { ...theme.typography.body },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: theme.colors.card,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  summaryRow: { alignItems: 'center' },
  summaryLabel: { ...theme.typography.caption, color: theme.colors.textSecondary },
  summaryValue: { ...theme.typography.subtitle, marginTop: 4 },
  recordButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  recordButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  instTitle: { ...theme.typography.subtitle, marginBottom: theme.spacing.sm, color: theme.colors.text },
  instRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.radius.sm,
    marginBottom: theme.spacing.xs,
    borderLeftWidth: 4,
    ...theme.shadows.sm,
  },
  instMonth: { ...theme.typography.body, width: '30%' },
  instDue: { ...theme.typography.caption, width: '25%' },
  instAmount: { width: '25%', fontWeight: '600' },
  instStatus: { width: '20%', fontSize: 12 },
});
