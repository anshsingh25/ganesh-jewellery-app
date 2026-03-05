import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Switch } from 'react-native';
import { useApp } from '../../context/AppContext';
import { theme } from '../../theme';

export default function CustomerProfileScreen() {
  const { loggedInCustomer, setLoggedInCustomer, updateCustomer } = useApp();

  if (!loggedInCustomer) return null;

  const logout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: () => setLoggedInCustomer(null) },
      ]
    );
  };

  const docStatus = loggedInCustomer.documentStatus ?? 'pending';

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.label}>Name</Text>
        <Text style={styles.value}>{loggedInCustomer.name}</Text>
        <Text style={styles.label}>Mobile</Text>
        <Text style={styles.value}>{loggedInCustomer.mobile}</Text>
        {loggedInCustomer.address ? (
          <>
            <Text style={styles.label}>Address</Text>
            <Text style={styles.value}>{loggedInCustomer.address}</Text>
          </>
        ) : null}
        <Text style={styles.label}>Scheme</Text>
        <Text style={styles.value}>
          {loggedInCustomer.schemeType} months • ₹{loggedInCustomer.monthlyEmiAmount}/month
        </Text>
        <Text style={styles.label}>Document verification</Text>
        <Text style={styles.value}>
          {docStatus === 'verified' ? '✅ Verified' : docStatus === 'rejected' ? '❌ Rejected' : '⏳ Pending'}
        </Text>
        <View style={styles.autoPayRow}>
          <Text style={styles.label}>Auto-pay</Text>
          <Switch
            value={!!loggedInCustomer.autoPayEnabled}
            onValueChange={(v) => updateCustomer({ ...loggedInCustomer, autoPayEnabled: v })}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            thumbColor="#fff"
          />
        </View>
      </View>
      <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.8}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.lg },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  label: { ...theme.typography.caption, color: theme.colors.textSecondary, marginTop: 12 },
  value: { ...theme.typography.body, color: theme.colors.text, marginTop: 4 },
  autoPayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  logoutBtn: {
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.pending,
    alignItems: 'center',
  },
  logoutText: { color: theme.colors.pending, fontWeight: '600' },
});
