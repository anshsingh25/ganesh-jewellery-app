import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import type { Customer } from '../types';
import { useApp } from '../context/AppContext';
import { theme } from '../theme';

export default function EditCustomerScreen({ route, navigation }: any) {
  const { customerId } = route.params;
  const { customers, updateCustomer } = useApp();
  const customer = customers.find((c) => c.id === customerId);

  const [name, setName] = useState(customer?.name ?? '');
  const [mobile, setMobile] = useState(customer?.mobile ?? '');
  const [address, setAddress] = useState(customer?.address ?? '');

  if (!customer) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>Customer not found.</Text>
      </View>
    );
  }

  const save = async () => {
    if (!name.trim() || !mobile.trim()) {
      Alert.alert('Error', 'Name and mobile are required.');
      return;
    }
    const updated: Customer = {
      ...customer,
      name: name.trim(),
      mobile: mobile.trim(),
      address: address.trim() || undefined,
    };
    await updateCustomer(updated);
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.label}>Name *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Customer name"
          placeholderTextColor={theme.colors.textSecondary}
        />
        <Text style={styles.label}>Mobile *</Text>
        <TextInput
          style={styles.input}
          value={mobile}
          onChangeText={setMobile}
          placeholder="10-digit mobile"
          keyboardType="phone-pad"
          placeholderTextColor={theme.colors.textSecondary}
        />
        <Text style={styles.label}>Address (optional)</Text>
        <TextInput
          style={[styles.input, styles.inputMultiline]}
          value={address}
          onChangeText={setAddress}
          placeholder="Address"
          multiline
          placeholderTextColor={theme.colors.textSecondary}
        />
        <TouchableOpacity style={styles.saveBtn} onPress={save} activeOpacity={0.8}>
          <Text style={styles.saveBtnText}>Save changes</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { padding: theme.spacing.lg },
  error: { padding: theme.spacing.lg, color: theme.colors.pending },
  label: { ...theme.typography.caption, color: theme.colors.textSecondary, marginBottom: 4, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.text,
  },
  inputMultiline: { minHeight: 60, textAlignVertical: 'top' },
  saveBtn: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    marginTop: theme.spacing.xl,
  },
  saveBtnText: { color: '#fff', fontWeight: '700' },
});
