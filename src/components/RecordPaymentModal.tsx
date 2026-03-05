import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import type { Customer, Installment, ExtraPaymentOption } from '../types';
import { getNextUnpaidInstallment, getEarlyClosureAmount } from '../utils/emiLogic';
import { createOrder, openCheckout, setPendingPayment } from '../services/payment';
import * as storage from '../services/storage';
import { theme } from '../theme';

type PaymentMode = 'single' | 'extra' | 'multiple' | 'scheme_change' | 'early_close' | null;

interface Props {
  visible: boolean;
  onClose: () => void;
  customer: Customer;
  installments: Installment[];
  remainingBalance: number;
  minimumAmount?: number;
  onRecordSingle: (amount: number) => void;
  onRecordExtra: (amount: number, option: ExtraPaymentOption) => void;
  onRecordMultiple: (amount: number) => void;
  onChangeScheme: (newRemainingMonths: number) => void;
  onEarlyClose: () => void;
}

export default function RecordPaymentModal({
  visible,
  onClose,
  customer,
  installments,
  remainingBalance,
  minimumAmount = 0,
  onRecordSingle,
  onRecordExtra,
  onRecordMultiple,
  onChangeScheme,
  onEarlyClose,
}: Props) {
  const [mode, setMode] = useState<PaymentMode>(null);
  const [amount, setAmount] = useState('');
  const [extraOption, setExtraOption] = useState<ExtraPaymentOption>('adjust_last');
  const [newMonths, setNewMonths] = useState('');

  const nextInst = getNextUnpaidInstallment(installments);
  const earlyCloseAmount = getEarlyClosureAmount(installments);

  const reset = () => {
    setMode(null);
    setAmount('');
    setExtraOption('adjust_last');
    setNewMonths('');
  };

  const validateMin = (amt: number): boolean => {
    if (minimumAmount > 0 && amt < minimumAmount) {
      Alert.alert('Minimum amount', `Payment cannot be less than ₹${minimumAmount.toLocaleString('en-IN')}.`);
      return false;
    }
    return true;
  };

  const submit = () => {
    if (mode === 'single') {
      const amt = parseInt(amount, 10) || (nextInst?.amount ?? 0);
      if (!validateMin(amt)) return;
      onRecordSingle(amt);
      reset();
      onClose();
      return;
    }
    if (mode === 'extra') {
      const amt = parseInt(amount, 10);
      if (!amt || amt <= 0) {
        Alert.alert('Error', 'Enter valid amount.');
        return;
      }
      if (!validateMin(amt)) return;
      onRecordExtra(amt, extraOption);
      reset();
      onClose();
      return;
    }
    if (mode === 'multiple') {
      const amt = parseInt(amount, 10);
      if (!amt || amt <= 0) {
        Alert.alert('Error', 'Enter valid amount.');
        return;
      }
      if (!validateMin(amt)) return;
      onRecordMultiple(amt);
      reset();
      onClose();
      return;
    }
    if (mode === 'scheme_change') {
      const months = parseInt(newMonths, 10);
      if (!months || months < 1) {
        Alert.alert('Error', 'Enter valid number of remaining months.');
        return;
      }
      onChangeScheme(months);
      reset();
      onClose();
      return;
    }
    if (mode === 'early_close') {
      onEarlyClose();
      reset();
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Record Payment</Text>
            <TouchableOpacity onPress={() => { reset(); onClose(); }}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          </View>

          {!mode ? (
            <>
              <TouchableOpacity
                style={[styles.modeBtn, styles.modeBtnPrimary]}
                onPress={async () => {
                  if (!nextInst) return;
                  const apiUrl = await storage.getPaymentApiUrl();
                  if (!apiUrl) {
                    Alert.alert('Payment not set up', 'Set Payment server URL in Settings first.');
                    return;
                  }
                  try {
                    const { orderId, keyId } = await createOrder(
                      apiUrl,
                      nextInst.amount,
                      customer.id,
                      nextInst.id,
                      customer.name
                    );
                    setPendingPayment({
                      orderId,
                      customerId: customer.id,
                      installmentId: nextInst.id,
                      amount: nextInst.amount,
                      monthNumber: nextInst.monthNumber,
                      customerName: customer.name,
                    });
                    reset();
                    onClose();
                    await openCheckout(apiUrl, orderId, keyId);
                  } catch (e: any) {
                    Alert.alert('Payment error', e?.message || 'Could not start payment.');
                  }
                }}
              >
                <Text style={styles.modeBtnTextPrimary}>Collect via UPI / Card (₹{nextInst?.amount ?? 0})</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modeBtn}
                onPress={() => setMode('single')}
              >
                <Text style={styles.modeBtnText}>Single EMI – cash (₹{nextInst?.amount ?? 0})</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modeBtn}
                onPress={() => setMode('extra')}
              >
                <Text style={styles.modeBtnText}>Pay extra this month</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modeBtn}
                onPress={() => setMode('multiple')}
              >
                <Text style={styles.modeBtnText}>Pay multiple (e.g. double for skip)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modeBtn}
                onPress={() => setMode('scheme_change')}
              >
                <Text style={styles.modeBtnText}>Change scheme (5↔11 months)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modeBtn}
                onPress={() => setMode('early_close')}
              >
                <Text style={styles.modeBtnText}>Full settlement (₹{earlyCloseAmount})</Text>
              </TouchableOpacity>
            </>
          ) : (
            <ScrollView style={styles.form}>
              {mode === 'single' && (
                <>
                  <Text style={styles.hint}>Amount (default: next EMI ₹{nextInst?.amount ?? 0})</Text>
                  <TextInput
                    style={styles.input}
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="number-pad"
                    placeholder={String(nextInst?.amount ?? 0)}
                    placeholderTextColor={theme.colors.textSecondary}
                  />
                </>
              )}
              {mode === 'extra' && (
                <>
                  <Text style={styles.hint}>Amount to pay (e.g. 10000 for double)</Text>
                  <TextInput
                    style={styles.input}
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="number-pad"
                    placeholder="10000"
                    placeholderTextColor={theme.colors.textSecondary}
                  />
                  <Text style={styles.hint}>Use extra to:</Text>
                  {(
                    [
                      { key: 'adjust_last' as const, label: 'Adjust in last EMI' },
                      { key: 'reduce_emi' as const, label: 'Reduce future monthly EMI' },
                      { key: 'reduce_duration' as const, label: 'Reduce duration (finish early)' },
                    ] as const
                  ).map(({ key, label }) => (
                    <TouchableOpacity
                      key={key}
                      style={[styles.optionBtn, extraOption === key && styles.optionBtnActive]}
                      onPress={() => setExtraOption(key)}
                    >
                      <Text style={extraOption === key ? styles.optionBtnTextActive : styles.optionBtnText}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </>
              )}
              {mode === 'multiple' && (
                <>
                  <Text style={styles.hint}>Total amount (e.g. 10000 for two EMIs)</Text>
                  <TextInput
                    style={styles.input}
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="number-pad"
                    placeholder="10000"
                    placeholderTextColor={theme.colors.textSecondary}
                  />
                </>
              )}
              {mode === 'scheme_change' && (
                <>
                  <Text style={styles.hint}>
                    Remaining amount ₹{remainingBalance.toLocaleString('en-IN')}. Spread over how many months?
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={newMonths}
                    onChangeText={setNewMonths}
                    keyboardType="number-pad"
                    placeholder="e.g. 9"
                    placeholderTextColor={theme.colors.textSecondary}
                  />
                  <Text style={styles.caption}>New EMI ≈ ₹{Math.ceil(remainingBalance / (parseInt(newMonths, 10) || 1)).toLocaleString('en-IN')}/month</Text>
                </>
              )}
              {mode === 'early_close' && (
                <Text style={styles.hint}>
                  Settle full remaining ₹{earlyCloseAmount.toLocaleString('en-IN')} and close scheme?
                </Text>
              )}
              <View style={styles.row}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setMode(null)}>
                  <Text style={styles.cancelBtnText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.submitBtn} onPress={submit}>
                  <Text style={styles.submitBtnText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  title: { ...theme.typography.title },
  close: { fontSize: 24, color: theme.colors.textSecondary },
  modeBtn: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.sm,
  },
  modeBtnPrimary: {
    backgroundColor: theme.colors.primary,
  },
  modeBtnText: { ...theme.typography.body, color: theme.colors.text },
  modeBtnTextPrimary: { ...theme.typography.body, color: '#fff', fontWeight: '600' },
  form: { marginTop: 8 },
  hint: { ...theme.typography.caption, color: theme.colors.textSecondary, marginBottom: 4 },
  caption: { ...theme.typography.caption, color: theme.colors.primary, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.text,
  },
  optionBtn: {
    padding: theme.spacing.sm,
    marginBottom: 4,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  optionBtnActive: { borderColor: theme.colors.primary, backgroundColor: theme.colors.card },
  optionBtnText: { ...theme.typography.body },
  optionBtnTextActive: { ...theme.typography.body, color: theme.colors.primary, fontWeight: '600' },
  row: { flexDirection: 'row', gap: 12, marginTop: theme.spacing.md },
  cancelBtn: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  cancelBtnText: { color: theme.colors.text },
  submitBtn: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
  },
  submitBtnText: { color: '#fff', fontWeight: '700' },
});
