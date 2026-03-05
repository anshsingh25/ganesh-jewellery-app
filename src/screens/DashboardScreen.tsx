import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { computeDashboardStats, getOverdueCustomers } from '../utils/dashboard';
import { theme } from '../theme';

function StatCard({
  title,
  value,
  subtitle,
  color,
  icon,
}: {
  title: string;
  value: string;
  subtitle?: string;
  color?: string;
  icon?: string;
}) {
  return (
    <View style={[styles.statCard, color ? { borderLeftColor: color } : null]}>
      {icon ? <Text style={styles.statIcon}>{icon}</Text> : null}
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={[styles.statValue, color ? { color } : null]}>{value}</Text>
      {subtitle ? <Text style={styles.statSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export default function DashboardScreen() {
  const { customers, setUser } = useApp();
  const navigation = useNavigation();
  const stats = computeDashboardStats(customers);
  const overdueList = getOverdueCustomers(customers);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => setUser(null)} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, setUser]);

  const formatMoney = (n: number) => `₹${n.toLocaleString('en-IN')}`;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Dashboard</Text>

      <StatCard
        icon="👥"
        title="Active customers"
        value={String(stats.activeCustomers)}
      />
      <StatCard
        icon="📅"
        title="Expected this month"
        value={formatMoney(stats.expectedThisMonth)}
      />
      <StatCard
        icon="✓"
        title="Collected this month"
        value={formatMoney(stats.collectedThisMonth)}
        color={theme.colors.paid}
      />
      <StatCard
        icon="⏳"
        title="Pending this month"
        value={formatMoney(stats.pendingThisMonth)}
        color={theme.colors.pending}
      />
      <StatCard
        icon="⚠"
        title="Overdue"
        value={`${stats.overdueCount} (${formatMoney(stats.overdueAmount)})`}
        color={theme.colors.overdue}
      />

      {overdueList.length > 0 && (
        <View style={styles.overdueSection}>
          <Text style={styles.overdueTitle}>⚠ Overdue customers</Text>
          {overdueList.slice(0, 10).map((c) => {
            const overdueInst = c.installments.find((i) => i.status === 'overdue');
            return (
              <View key={c.id} style={styles.overdueRow}>
                <Text style={styles.overdueName}>{c.name}</Text>
                <Text style={styles.overdueAmount}>
                  ₹{overdueInst?.amount ?? 0} – {overdueInst?.dueDate}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.lg, paddingBottom: 40 },
  header: {
    ...theme.typography.titleLarge,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  statCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
    ...theme.shadows.sm,
  },
  statIcon: { fontSize: 20, marginBottom: 4 },
  statTitle: { ...theme.typography.caption, color: theme.colors.textSecondary },
  statValue: { ...theme.typography.subtitle, fontSize: 18, color: theme.colors.text, marginTop: 4 },
  statSubtitle: { ...theme.typography.caption, color: theme.colors.textSecondary, marginTop: 2 },
  overdueSection: {
    marginTop: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.overdue,
    ...theme.shadows.sm,
  },
  overdueTitle: { ...theme.typography.subtitle, color: theme.colors.overdue, marginBottom: 8 },
  overdueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  overdueName: { ...theme.typography.body, color: theme.colors.text },
  overdueAmount: { ...theme.typography.caption, color: theme.colors.overdue },
  logoutBtn: { marginRight: 12, paddingVertical: 4, paddingHorizontal: 8 },
  logoutText: { color: theme.colors.primaryDark, fontWeight: '600', fontSize: 16 },
});
