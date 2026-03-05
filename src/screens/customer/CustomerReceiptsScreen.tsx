import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useApp } from '../../context/AppContext';
import { generateReceiptText } from '../../utils/receipt';
import ReceiptModal from '../../components/ReceiptModal';
import { theme } from '../../theme';

export default function CustomerReceiptsScreen() {
  const { loggedInCustomer } = useApp();
  const [receiptText, setReceiptText] = useState<string | null>(null);

  if (!loggedInCustomer) return null;

  const paidInstallments = loggedInCustomer.installments
    .filter((i) => i.status === 'paid' && i.paidDate)
    .sort((a, b) => (b.paidDate ?? '').localeCompare(a.paidDate ?? ''));

  const viewReceipt = (paidDate: string, amount: number, monthNumber: number) => {
    const text = generateReceiptText(
      loggedInCustomer,
      amount,
      [monthNumber],
      paidDate
    );
    setReceiptText(text);
  };

  if (paidInstallments.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.empty}>No payments yet. Receipts will appear here after you pay at the shop.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My receipts</Text>
      <FlatList
        data={paidInstallments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => viewReceipt(item.paidDate!, item.paidAmount ?? item.amount, item.monthNumber)}
            activeOpacity={0.7}
          >
            <View>
              <Text style={styles.rowTitle}>Month {item.monthNumber}</Text>
              <Text style={styles.rowDate}>{item.paidDate}</Text>
            </View>
            <Text style={styles.rowAmount}>₹{(item.paidAmount ?? item.amount).toLocaleString('en-IN')}</Text>
            <Text style={styles.viewLink}>View →</Text>
          </TouchableOpacity>
        )}
      />
      <ReceiptModal
        visible={receiptText !== null}
        receiptText={receiptText ?? ''}
        onClose={() => setReceiptText(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { ...theme.typography.subtitle, padding: theme.spacing.lg, paddingBottom: 0 },
  list: { padding: theme.spacing.lg, paddingBottom: 40 },
  empty: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.xl,
    padding: theme.spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.sm,
  },
  rowTitle: { ...theme.typography.body, color: theme.colors.text },
  rowDate: { ...theme.typography.caption, color: theme.colors.textSecondary, marginTop: 2 },
  rowAmount: { ...theme.typography.subtitle, marginLeft: 'auto', marginRight: 8 },
  viewLink: { ...theme.typography.caption, color: theme.colors.primary },
});
