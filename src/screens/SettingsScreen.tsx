import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import * as storage from '../services/storage';
import * as api from '../services/api';
import { useSyncedStorage } from '../hooks/useSyncedStorage';
import { useApp } from '../context/AppContext';
import { theme } from '../theme';

export default function SettingsScreen({ navigation }: any) {
  const { useApiMode, apiBaseUrl, ownerToken, refreshCustomers } = useApp();
  const { getMinimumAmount, setMinimumAmount: setMinAmount } = useSyncedStorage();
  const [minimumAmount, setMinimumAmount] = useState('');
  const [paymentApiUrl, setPaymentApiUrl] = useState('');
  const [saved, setSaved] = useState(false);
  const [copyingToDb, setCopyingToDb] = useState(false);

  useEffect(() => {
    getMinimumAmount().then((n) => setMinimumAmount(n > 0 ? String(n) : ''));
    storage.getPaymentApiUrl().then(setPaymentApiUrl);
  }, [getMinimumAmount]);

  const saveMinimum = async () => {
    const n = parseInt(minimumAmount, 10);
    const value = isNaN(n) || n < 0 ? 0 : n;
    await setMinAmount(value);
    setMinimumAmount(value > 0 ? String(value) : '');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const savingToServer = useApiMode && apiBaseUrl && ownerToken;

  const copyLocalCustomersToDatabase = async () => {
    if (!apiBaseUrl || !ownerToken) return;
    setCopyingToDb(true);
    try {
      const localList = await storage.getCustomers();
      if (localList.length === 0) {
        Alert.alert('No local customers', 'There are no customers on this device to copy. Add customers and they will save to the database when you are logged in with the server.');
        return;
      }
      let ok = 0;
      let failed = 0;
      for (const c of localList) {
        try {
          await api.addCustomer(apiBaseUrl, ownerToken, c);
          ok += 1;
        } catch {
          failed += 1;
        }
      }
      await refreshCustomers();
      Alert.alert(
        'Copy to database',
        `${ok} customer(s) inserted into the database.${failed > 0 ? ` ${failed} skipped (may already exist).` : ''}`
      );
    } catch (e: any) {
      Alert.alert('Copy failed', e?.message || 'Could not copy customers to the database.');
    } finally {
      setCopyingToDb(false);
    }
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.syncStatus}>
        <Text style={styles.syncLabel}>
          {savingToServer
            ? '✓ Database mode: all customers and schemes are saved to and loaded from the database only.'
            : 'Saving to this device only (set Server URL for database)'}
        </Text>
        {useApiMode && apiBaseUrl && !ownerToken && (
          <Text style={styles.syncHint}>Log in with PIN 1234 so all data is stored in and fetched from the database.</Text>
        )}
        {!useApiMode && paymentApiUrl.trim() && (
          <Text style={styles.syncHint}>Restart the app after saving Server URL to use the database for all data.</Text>
        )}
      </View>

      <Text style={styles.label}>Minimum EMI amount (₹)</Text>
      <Text style={styles.hint}>Customers cannot pay less than this amount per installment. Set 0 to allow any amount.</Text>
      <TextInput
        style={styles.input}
        value={minimumAmount}
        onChangeText={setMinimumAmount}
        placeholder="e.g. 1000"
        keyboardType="number-pad"
        placeholderTextColor={theme.colors.textSecondary}
      />
      <TouchableOpacity style={styles.button} onPress={saveMinimum} activeOpacity={0.8}>
        <Text style={styles.buttonText}>{saved ? 'Saved ✓' : 'Save'}</Text>
      </TouchableOpacity>

      <View style={styles.paymentSection}>
        <Text style={styles.sectionTitle}>Payment methods (customers can pay via)</Text>
        <View style={styles.paymentCard}>
          <Text style={styles.paymentMethod}>Razorpay – UPI, Debit/Credit Card</Text>
          <Text style={styles.paymentHint}>Customers see "Pay with UPI / Card" when Server URL and Razorpay are set up.</Text>
        </View>
        <TouchableOpacity
          style={styles.link}
          onPress={() => navigation.navigate('PaymentMethods')}
          activeOpacity={0.7}
        >
          <Text style={styles.linkText}>Payment methods & setup →</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Server URL (multi-device sync + payments)</Text>
      <Text style={styles.hint}>Backend URL for sync across devices and UPI/Card payments. E.g. https://your-server.com or http://IP:3000. Restart app after saving.</Text>
      <TextInput
        style={styles.input}
        value={paymentApiUrl}
        onChangeText={setPaymentApiUrl}
        placeholder="https://..."
        autoCapitalize="none"
        placeholderTextColor={theme.colors.textSecondary}
      />
      <TouchableOpacity
        style={styles.button}
        onPress={async () => {
          await storage.setPaymentApiUrl(paymentApiUrl);
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        }}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>Save Server URL</Text>
      </TouchableOpacity>

      {savingToServer && (
        <>
          <Text style={styles.label}>Copy local customers to database</Text>
          <Text style={styles.hint}>One-time: insert all customers from this device into the MySQL database table.</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={copyLocalCustomersToDatabase}
            disabled={copyingToDb}
            activeOpacity={0.8}
          >
            {copyingToDb ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Copy all to database</Text>
            )}
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity
        style={styles.link}
        onPress={() => navigation.navigate('Schemes')}
        activeOpacity={0.7}
      >
        <Text style={styles.linkText}>Manage schemes →</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: theme.colors.background },
  container: { padding: theme.spacing.lg, paddingBottom: 40 },
  title: { ...theme.typography.titleLarge, marginBottom: theme.spacing.lg, color: theme.colors.text },
  syncStatus: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.xl,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
    ...theme.shadows.sm,
  },
  syncLabel: { ...theme.typography.subtitle, marginBottom: 4 },
  syncHint: { ...theme.typography.caption, color: theme.colors.textSecondary },
  paymentSection: { marginBottom: theme.spacing.xl },
  sectionTitle: { ...theme.typography.subtitle, marginBottom: 8, color: theme.colors.text },
  paymentCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.md,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
    ...theme.shadows.sm,
  },
  paymentMethod: { ...theme.typography.subtitle, marginBottom: 4 },
  paymentHint: { ...theme.typography.caption, color: theme.colors.textSecondary },
  label: { ...theme.typography.subtitle, marginBottom: 4, color: theme.colors.text },
  hint: { ...theme.typography.caption, color: theme.colors.textSecondary, marginBottom: 8 },
  input: {
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    ...theme.shadows.sm,
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  link: { paddingVertical: theme.spacing.md },
  linkText: { ...theme.typography.body, color: theme.colors.primary, fontWeight: '600' },
});
