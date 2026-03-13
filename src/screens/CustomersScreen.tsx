import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
} from 'react-native';
import type { Customer } from '../types';
import { useApp } from '../context/AppContext';
import { getTotalPaid, getRemainingBalance, getNextUnpaidInstallment } from '../utils/emiLogic';
import { theme } from '../theme';

function CustomerRow({
  customer,
  onPress,
}: {
  customer: Customer;
  onPress: () => void;
}) {
  const totalPaid = getTotalPaid(customer.installments);
  const remaining = getRemainingBalance(customer.installments);
  const next = getNextUnpaidInstallment(customer.installments);

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.rowLeft}>
        <Text style={styles.name}>{customer.name}</Text>
        <Text style={styles.mobile}>{customer.mobile}</Text>
        <Text style={styles.scheme}>
          {customer.schemeType} months • ₹{customer.monthlyEmiAmount}/month
        </Text>
      </View>
      <View style={styles.rowRight}>
        <Text style={styles.paid}>Paid: ₹{totalPaid.toLocaleString('en-IN')}</Text>
        <Text style={styles.remaining}>Left: ₹{remaining.toLocaleString('en-IN')}</Text>
        {next && (
          <Text style={styles.due} numberOfLines={1}>
            Due: {next.dueDate}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function CustomersScreen({ navigation }: any) {
  const { customers } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'closed'>('all');
  const [schemeFilter, setSchemeFilter] = useState<'all' | '5' | '11'>('all');

  const filtered = customers.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) || c.mobile.includes(search);
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchScheme = schemeFilter === 'all' || String(c.schemeType) === schemeFilter;
    return matchSearch && matchStatus && matchScheme;
  });

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Search by name or mobile..."
        value={search}
        onChangeText={setSearch}
        placeholderTextColor={theme.colors.textSecondary}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersRow}
        contentContainerStyle={styles.filtersContent}
      >
        <Text style={styles.filterLabel}>Status:</Text>
        {(['all', 'active', 'completed', 'closed'] as const).map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.filterChip, statusFilter === s && styles.filterChipActive]}
            onPress={() => setStatusFilter(s)}
          >
            <Text style={[styles.filterChipText, statusFilter === s && styles.filterChipTextActive]}>
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
        <Text style={[styles.filterLabel, { marginLeft: theme.spacing.md }]}>Scheme:</Text>
        {(['all', '5', '11'] as const).map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.filterChip, schemeFilter === s && styles.filterChipActive]}
            onPress={() => setSchemeFilter(s)}
          >
            <Text style={[styles.filterChipText, schemeFilter === s && styles.filterChipTextActive]}>
              {s === 'all' ? 'All' : `${s} mo`}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('AddCustomer')}
        activeOpacity={0.85}
      >
        <Text style={styles.addButtonText}>+ Add Customer</Text>
      </TouchableOpacity>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CustomerRow
            customer={item}
            onPress={() => navigation.navigate('CustomerDetail', { customerId: item.id })}
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {search || statusFilter !== 'all' || schemeFilter !== 'all'
              ? 'No customers match the filters.'
              : 'No customers yet. Add one!'}
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  search: {
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    fontSize: 16,
    color: theme.colors.text,
    ...theme.shadows.sm,
  },
  filtersRow: { maxHeight: 44, marginBottom: theme.spacing.sm },
  filtersContent: {
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  filterLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginRight: theme.spacing.xs,
  },
  filterChip: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.sm,
  },
  filterChipActive: { backgroundColor: theme.colors.primary },
  filterChipText: { ...theme.typography.caption, color: theme.colors.text },
  filterChipTextActive: { color: '#fff' },
  addButton: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    ...theme.shadows.sm,
  },
  addButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  list: { padding: theme.spacing.md, paddingBottom: 40 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  rowLeft: { flex: 1 },
  rowRight: { alignItems: 'flex-end' },
  name: { ...theme.typography.subtitle, color: theme.colors.text },
  mobile: { ...theme.typography.caption, color: theme.colors.textSecondary, marginTop: 2 },
  scheme: { ...theme.typography.caption, color: theme.colors.primary, marginTop: 2 },
  paid: { ...theme.typography.caption, color: theme.colors.paid },
  remaining: { ...theme.typography.caption, color: theme.colors.pending, marginTop: 2 },
  due: { ...theme.typography.caption, color: theme.colors.textSecondary, marginTop: 2 },
  empty: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.xl,
  },
});
