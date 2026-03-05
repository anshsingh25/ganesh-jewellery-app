import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useApp } from '../context/AppContext';
import * as api from '../services/api';
import { theme } from '../theme';

export default function CustomerLoginScreen({ navigation }: any) {
  const { customers, setLoggedInCustomer, useApiMode, apiBaseUrl } = useApp();
  const [mobile, setMobile] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  const login = async () => {
    const trimmed = mobile.trim().replace(/\D/g, '');
    if (trimmed.length < 10) {
      Alert.alert('Invalid mobile', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    if (useApiMode && apiBaseUrl) {
      setLoading(true);
      try {
        const { token, customer } = await api.customerLogin(apiBaseUrl, mobile.trim(), pin);
        await setLoggedInCustomer(customer, token);
      } catch (e: any) {
        Alert.alert('Login failed', e?.message || 'Invalid mobile or PIN.');
      } finally {
        setLoading(false);
      }
    } else {
      const customer = customers.find(
        (c) => c.mobile.replace(/\D/g, '') === trimmed || c.mobile === trimmed
      );
      if (!customer) {
        Alert.alert('Not found', 'No EMI scheme found for this mobile number. Please contact the shop.');
        return;
      }
      const expectedPin = customer.customerPin ?? customer.mobile.slice(-4);
      if (pin !== expectedPin) {
        Alert.alert('Wrong PIN', 'Invalid PIN. Use the PIN given by the shop or last 4 digits of your mobile.');
        return;
      }
      await setLoggedInCustomer(customer);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Customer Login</Text>
        <Text style={styles.subtitle}>View your EMI & receipts</Text>

        <TextInput
          style={styles.input}
          placeholder="Mobile number"
          value={mobile}
          onChangeText={setMobile}
          keyboardType="phone-pad"
          placeholderTextColor={theme.colors.textSecondary}
        />
        <TextInput
          style={styles.input}
          placeholder="PIN (from shop or last 4 digits of mobile)"
          value={pin}
          onChangeText={setPin}
          keyboardType="number-pad"
          secureTextEntry
          placeholderTextColor={theme.colors.textSecondary}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={login}
          activeOpacity={0.8}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.back}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xl,
    ...theme.shadows.lg,
  },
  title: { ...theme.typography.titleLarge, color: theme.colors.text, textAlign: 'center' },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.text,
    backgroundColor: theme.colors.background,
  },
  button: {
    width: '100%',
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  back: { marginTop: theme.spacing.lg, alignItems: 'center' },
  backText: { ...theme.typography.body, color: theme.colors.primary },
});
