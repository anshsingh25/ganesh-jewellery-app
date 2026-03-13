import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Switch, TextInput, ScrollView } from 'react-native';
import { useApp } from '../../context/AppContext';
import { theme } from '../../theme';

export default function CustomerProfileScreen() {
  const { loggedInCustomer, setLoggedInCustomer, updateCustomer } = useApp();

  if (!loggedInCustomer) return null;

  const [name, setName] = useState(loggedInCustomer.name);
  const [mobile, setMobile] = useState(loggedInCustomer.mobile);
  const [whatsapp, setWhatsapp] = useState(loggedInCustomer.whatsappNumber || '');
  const [address, setAddress] = useState(loggedInCustomer.address || '');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  useEffect(() => {
    setName(loggedInCustomer.name);
    setMobile(loggedInCustomer.mobile);
    setWhatsapp(loggedInCustomer.whatsappNumber || '');
    setAddress(loggedInCustomer.address || '');
  }, [loggedInCustomer]);

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

  const saveProfile = async () => {
    const trimmedName = name.trim();
    const trimmedMobile = mobile.trim();
    if (!trimmedName || !trimmedMobile) {
      Alert.alert('Required', 'Name and mobile are required.');
      return;
    }
    const updated = {
      ...loggedInCustomer,
      name: trimmedName,
      mobile: trimmedMobile,
      whatsappNumber: whatsapp.trim() || undefined,
      address: address.trim() || undefined,
    };
    await updateCustomer(updated);
    Alert.alert('Saved', 'Profile updated.');
  };

  const changePin = async () => {
    const expectedCurrent =
      loggedInCustomer.customerPin || String(loggedInCustomer.mobile).slice(-4);
    if (!currentPin || currentPin !== expectedCurrent) {
      Alert.alert('Incorrect PIN', 'Current PIN does not match.');
      return;
    }
    if (!newPin || newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      Alert.alert('Invalid PIN', 'New PIN must be exactly 4 digits.');
      return;
    }
    if (newPin !== confirmPin) {
      Alert.alert('PIN mismatch', 'New PIN and confirm PIN do not match.');
      return;
    }
    const updated = {
      ...loggedInCustomer,
      customerPin: newPin,
    };
    await updateCustomer(updated);
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    Alert.alert('PIN changed', 'Your login PIN has been updated.');
  };

  const docStatus = loggedInCustomer.documentStatus ?? 'pending';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>My details</Text>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          placeholderTextColor={theme.colors.textSecondary}
        />
        <Text style={styles.label}>Mobile</Text>
        <TextInput
          style={styles.input}
          value={mobile}
          onChangeText={setMobile}
          keyboardType="phone-pad"
          placeholder="10 digit mobile"
          placeholderTextColor={theme.colors.textSecondary}
        />
        <Text style={styles.label}>WhatsApp number</Text>
        <TextInput
          style={styles.input}
          value={whatsapp}
          onChangeText={setWhatsapp}
          keyboardType="phone-pad"
          placeholder="Same as mobile or different"
          placeholderTextColor={theme.colors.textSecondary}
        />
        <Text style={styles.label}>Address</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={address}
          onChangeText={setAddress}
          placeholder="Your address"
          placeholderTextColor={theme.colors.textSecondary}
          multiline
        />
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
        <TouchableOpacity style={styles.saveBtn} onPress={saveProfile} activeOpacity={0.8}>
          <Text style={styles.saveText}>Save profile</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Change login PIN</Text>
        <Text style={styles.hint}>Default PIN is last 4 digits of your mobile unless owner has set one.</Text>
        <Text style={styles.label}>Current PIN</Text>
        <TextInput
          style={styles.input}
          value={currentPin}
          onChangeText={setCurrentPin}
          keyboardType="number-pad"
          secureTextEntry
          placeholder="Current 4-digit PIN"
          placeholderTextColor={theme.colors.textSecondary}
        />
        <Text style={styles.label}>New PIN</Text>
        <TextInput
          style={styles.input}
          value={newPin}
          onChangeText={setNewPin}
          keyboardType="number-pad"
          secureTextEntry
          placeholder="New 4-digit PIN"
          placeholderTextColor={theme.colors.textSecondary}
        />
        <Text style={styles.label}>Confirm new PIN</Text>
        <TextInput
          style={styles.input}
          value={confirmPin}
          onChangeText={setConfirmPin}
          keyboardType="number-pad"
          secureTextEntry
          placeholder="Repeat new PIN"
          placeholderTextColor={theme.colors.textSecondary}
        />
        <TouchableOpacity style={styles.saveBtn} onPress={changePin} activeOpacity={0.8}>
          <Text style={styles.saveText}>Change PIN</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.8}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.lg, paddingBottom: theme.spacing.xl },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  sectionTitle: { ...theme.typography.subtitle, color: theme.colors.text, marginBottom: 4 },
  label: { ...theme.typography.caption, color: theme.colors.textSecondary, marginTop: 12 },
  value: { ...theme.typography.body, color: theme.colors.text, marginTop: 4 },
  autoPayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: 16,
    color: theme.colors.text,
    marginTop: 4,
  },
  multiline: {
    height: 72,
    textAlignVertical: 'top',
  },
  hint: { ...theme.typography.caption, color: theme.colors.textSecondary, marginTop: 4 },
  saveBtn: {
    marginTop: theme.spacing.lg,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
    alignItems: 'center',
  },
  saveText: { color: '#fff', fontWeight: '700' },
  logoutBtn: {
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.pending,
    alignItems: 'center',
  },
  logoutText: { color: theme.colors.pending, fontWeight: '600' },
});
