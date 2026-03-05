import React, { useEffect, useRef } from 'react';
import { Linking, Alert } from 'react-native';
import { useApp } from '../context/AppContext';
import {
  getPendingPayment,
  clearPendingPayment,
  verifyPayment,
  parsePaymentSuccessUrl,
} from '../services/payment';
import * as storage from '../services/storage';
import { markInstallmentPaid } from '../utils/emiLogic';
import { generateReceiptText } from '../utils/receipt';

/**
 * Listens for payment success deep link, verifies with backend, and marks installment paid.
 */
export default function PaymentSuccessHandler() {
  const { customers, updateCustomer } = useApp();
  const handling = useRef(false);

  useEffect(() => {
    const handleUrl = async (url: string | null) => {
      if (!url || handling.current) return;
      const params = parsePaymentSuccessUrl(url);
      if (!params) return;

      const pending = getPendingPayment();
      if (!pending || pending.orderId !== params.orderId) return;

      handling.current = true;
      const apiUrl = await storage.getPaymentApiUrl();
      if (!apiUrl) {
        Alert.alert('Error', 'Payment server URL not set.');
        clearPendingPayment();
        handling.current = false;
        return;
      }

      const valid = await verifyPayment(apiUrl, params.orderId, params.paymentId, params.signature);
      if (!valid) {
        Alert.alert('Payment failed', 'Verification failed. Please contact the shop.');
        clearPendingPayment();
        handling.current = false;
        return;
      }

      const customer = customers.find((c) => c.id === pending.customerId);
      if (!customer) {
        clearPendingPayment();
        handling.current = false;
        return;
      }

      const updatedInst = markInstallmentPaid(
        customer.installments,
        pending.installmentId,
        pending.amount
      );
      const updated = {
        ...customer,
        installments: updatedInst,
        status: (updatedInst.every((i) => i.status === 'paid') ? 'completed' : 'active') as 'active' | 'completed' | 'closed',
        completedDate: updatedInst.every((i) => i.status === 'paid')
          ? new Date().toISOString().slice(0, 10)
          : undefined,
      };
      await updateCustomer(updated);
      clearPendingPayment();

      const receiptText = generateReceiptText(
        { ...customer, installments: updatedInst },
        pending.amount,
        [pending.monthNumber],
        new Date().toISOString().slice(0, 10)
      );
      Alert.alert(
        'Payment successful',
        `₹${pending.amount.toLocaleString('en-IN')} received. Receipt can be shared from Receipts tab.`,
        [{ text: 'OK' }]
      );
      handling.current = false;
    };

    const sub = Linking.addEventListener('url', (e) => handleUrl(e.url));
    Linking.getInitialURL().then(handleUrl);
    return () => sub.remove();
  }, [customers, updateCustomer]);

  return null;
}
