import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useApp } from '../../context/AppContext';
import { updateOverdueStatus } from '../../utils/emiLogic';
import type { Installment } from '../../types';
import { theme } from '../../theme';

function InstallmentRow({ inst }: { inst: Installment }) {
  const isPaid = inst.status === 'paid';
  const isOverdue = inst.status === 'overdue';
  const color = isPaid ? theme.colors.paid : isOverdue ? theme.colors.overdue : theme.colors.pending;
  return (
    <View style={[styles.row, { borderLeftColor: color }]}>
      <View style={styles.rowLeft}>
        <Text style={styles.month}>Month {inst.monthNumber}</Text>
        <Text style={styles.due}>Due {inst.dueDate}</Text>
      </View>
      <Text style={[styles.amount, { color }]}>₹{inst.amount.toLocaleString('en-IN')}</Text>
      <Text style={[styles.status, { color }]}>
        {isPaid ? '✅ Paid' : isOverdue ? 'Overdue' : 'Pending'}
      </Text>
    </View>
  );
}

export default function CustomerInstallmentsScreen() {
  const { loggedInCustomer } = useApp();
  if (!loggedInCustomer) return null;

  const installments = updateOverdueStatus(loggedInCustomer.installments);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My installments</Text>
      <FlatList
        data={installments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <InstallmentRow inst={item} />}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { ...theme.typography.subtitle, padding: theme.spacing.lg, paddingBottom: 0 },
  list: { padding: theme.spacing.lg, paddingBottom: 40 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.radius.sm,
    marginBottom: theme.spacing.sm,
    borderLeftWidth: 4,
  },
  rowLeft: { flex: 1 },
  month: { ...theme.typography.body, color: theme.colors.text },
  due: { ...theme.typography.caption, color: theme.colors.textSecondary, marginTop: 2 },
  amount: { ...theme.typography.subtitle, marginRight: theme.spacing.sm },
  status: { ...theme.typography.caption },
});
