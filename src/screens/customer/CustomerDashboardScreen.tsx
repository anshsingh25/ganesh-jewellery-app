import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useApp } from '../../context/AppContext';
import {
  getTotalPaid,
  getRemainingBalance,
  getNextUnpaidInstallment,
  updateOverdueStatus,
  markInstallmentPaid,
} from '../../utils/emiLogic';
import { generateReceiptText } from '../../utils/receipt';
import { useSyncedStorage } from '../../hooks/useSyncedStorage';
import * as storage from '../../services/storage';
import {
  createOrder,
  openCheckout,
  setPendingPayment,
} from '../../services/payment';
import ReceiptModal from '../../components/ReceiptModal';
import { theme } from '../../theme';

export default function CustomerDashboardScreen() {
  const { loggedInCustomer, updateCustomer, globalNotice } = useApp();
  const { getMinimumAmount } = useSyncedStorage();
  const [minimumAmount, setMinimumAmount] = useState(0);
  const [receiptText, setReceiptText] = useState<string | null>(null);

  useEffect(() => {
    getMinimumAmount().then(setMinimumAmount);
  }, [getMinimumAmount]);

  if (!loggedInCustomer) return null;

  const installments = updateOverdueStatus(loggedInCustomer.installments);
  const totalPaid = getTotalPaid(installments);
  const remaining = getRemainingBalance(installments);
  const next = getNextUnpaidInstallment(installments);
  const paidCount = installments.filter((i) => i.status === 'paid').length;

  const handlePayWithUpiCard = async () => {
    if (!next) return;
    const minOk = minimumAmount <= 0 || next.amount >= minimumAmount;
    if (!minOk) {
      Alert.alert(
        'Minimum amount',
        `Payment cannot be less than ₹${minimumAmount.toLocaleString('en-IN')}.`
      );
      return;
    }
    const apiUrl = await storage.getPaymentApiUrl();
    if (!apiUrl) {
      Alert.alert(
        'Payment not set up',
        'The shop has not configured online payment. Please pay at the shop or ask them to set Payment URL in Settings.'
      );
      return;
    }
    try {
      const { orderId, keyId } = await createOrder(
        apiUrl,
        next.amount,
        loggedInCustomer.id,
        next.id,
        loggedInCustomer.name
      );
      setPendingPayment({
        orderId,
        customerId: loggedInCustomer.id,
        installmentId: next.id,
        amount: next.amount,
        monthNumber: next.monthNumber,
        customerName: loggedInCustomer.name,
      });
      await openCheckout(apiUrl, orderId, keyId);
    } catch (e: any) {
      Alert.alert('Payment error', e?.message || 'Could not start payment. Try again or pay at the shop.');
    }
  };

  const handlePayNow = () => {
    if (!next) return;
    const minOk = minimumAmount <= 0 || next.amount >= minimumAmount;
    if (!minOk) {
      Alert.alert(
        'Minimum amount',
        `Payment cannot be less than ₹${minimumAmount.toLocaleString('en-IN')}. Please pay at the shop.`
      );
      return;
    }
    Alert.alert(
      'Confirm payment',
      `Mark ₹${next.amount.toLocaleString('en-IN')} (Month ${next.monthNumber}) as paid?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'I have paid',
          onPress: async () => {
            const updatedInst = markInstallmentPaid(installments, next.id, next.amount);
            const updated = {
              ...loggedInCustomer,
              installments: updatedInst,
              status: (updatedInst.every((i) => i.status === 'paid') ? 'completed' : 'active') as 'active' | 'completed' | 'closed',
              completedDate: updatedInst.every((i) => i.status === 'paid')
                ? new Date().toISOString().slice(0, 10)
                : undefined,
            };
            await updateCustomer(updated);
            const text = generateReceiptText(
              { ...loggedInCustomer, installments: updatedInst },
              next.amount,
              [next.monthNumber],
              new Date().toISOString().slice(0, 10)
            );
            setReceiptText(text);
          },
        },
      ]
    );
  };

  const docStatus = loggedInCustomer.documentStatus ?? 'pending';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>Hello, {loggedInCustomer.name} 👋</Text>
      <Text style={styles.scheme}>
        {loggedInCustomer.schemeType} months • ₹{loggedInCustomer.monthlyEmiAmount}/month
      </Text>

      {globalNotice.trim() !== '' && (
        <View style={styles.noticeCard}>
          <Text style={styles.noticeTitle}>Notice from Ganesh Jewellers</Text>
          <Text style={styles.noticeText}>{globalNotice}</Text>
        </View>
      )}

      <View style={styles.docBadge}>
        <Text style={styles.docBadgeText}>
          Document: {docStatus === 'verified' ? '✅ Verified' : docStatus === 'rejected' ? '❌ Rejected' : '⏳ Pending'}
        </Text>
      </View>

      <View style={styles.cards}>
        <View style={[styles.card, { borderLeftColor: theme.colors.paid }]}>
          <Text style={styles.cardLabel}>Total paid</Text>
          <Text style={[styles.cardValue, { color: theme.colors.paid }]}>
            ₹{totalPaid.toLocaleString('en-IN')}
          </Text>
          <Text style={styles.cardSub}>{paidCount} of {installments.length} installments</Text>
        </View>
        <View style={[styles.card, { borderLeftColor: theme.colors.pending }]}>
          <Text style={styles.cardLabel}>Remaining</Text>
          <Text style={[styles.cardValue, { color: theme.colors.pending }]}>
            ₹{remaining.toLocaleString('en-IN')}
          </Text>
        </View>
      </View>

      {next && (
        <View style={[styles.nextCard, next.status === 'overdue' && styles.nextCardOverdue]}>
          <Text style={styles.nextLabel}>Next due</Text>
          <Text style={styles.nextDate}>{next.dueDate}</Text>
          <Text style={styles.nextAmount}>₹{next.amount.toLocaleString('en-IN')}</Text>
          {next.status === 'overdue' && (
            <Text style={styles.overdueBadge}>Overdue – please pay at the shop</Text>
          )}
          <TouchableOpacity style={[styles.payBtn, styles.payBtnPrimary]} onPress={handlePayWithUpiCard} activeOpacity={0.8}>
            <Text style={styles.payBtnTextPrimary}>Pay with UPI / Debit-Credit Card</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.payBtn} onPress={handlePayNow} activeOpacity={0.8}>
            <Text style={styles.payBtnText}>I paid at shop – Mark as paid</Text>
          </TouchableOpacity>
        </View>
      )}

      {paidCount === installments.length && (
        <View style={styles.completedCard}>
          <Text style={styles.completedText}>✅ Scheme completed. Thank you!</Text>
        </View>
      )}

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
  greeting: { ...theme.typography.title, color: theme.colors.text, marginBottom: 4 },
  scheme: { ...theme.typography.body, color: theme.colors.textSecondary, marginBottom: theme.spacing.sm },
  noticeCard: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.gold,
    marginBottom: theme.spacing.lg,
  },
  noticeTitle: { ...theme.typography.caption, color: theme.colors.textSecondary, marginBottom: 4 },
  noticeText: { ...theme.typography.body, color: theme.colors.text },
  docBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.sm,
    marginBottom: theme.spacing.lg,
  },
  docBadgeText: { ...theme.typography.caption },
  cards: { flexDirection: 'row', gap: theme.spacing.md, marginBottom: theme.spacing.lg },
  card: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderLeftWidth: 4,
  },
  cardLabel: { ...theme.typography.caption, color: theme.colors.textSecondary },
  cardValue: { ...theme.typography.subtitle, marginTop: 4 },
  cardSub: { ...theme.typography.caption, color: theme.colors.textSecondary, marginTop: 2 },
  nextCard: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  nextCardOverdue: { borderLeftColor: theme.colors.overdue },
  nextLabel: { ...theme.typography.caption, color: theme.colors.textSecondary },
  nextDate: { ...theme.typography.subtitle, marginTop: 4 },
  nextAmount: { ...theme.typography.title, color: theme.colors.primary, marginTop: 4 },
  overdueBadge: { ...theme.typography.caption, color: theme.colors.overdue, marginTop: 8 },
  payBtn: {
    marginTop: 8,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  payBtnPrimary: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  payBtnText: { color: theme.colors.text, fontWeight: '700' },
  payBtnTextPrimary: { color: '#fff', fontWeight: '700' },
  completedCard: {
    backgroundColor: theme.colors.paid,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    opacity: 0.9,
  },
  completedText: { color: '#fff', fontWeight: '600', textAlign: 'center' },
});
