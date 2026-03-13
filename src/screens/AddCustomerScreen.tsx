import React, { useState, useEffect } from 'react';
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
  Share,
  ActivityIndicator,
  Linking,
} from 'react-native';
import type { Customer, Scheme } from '../types';
import { useApp } from '../context/AppContext';
import { generateInstallments } from '../utils/emiLogic';
import { scheduleRemindersForCustomer } from '../services/reminders';
import { generateCustomerPin } from '../utils/pin';
import { getCustomerPinWhatsAppMessage } from '../utils/whatsappMessage';
import { useSyncedStorage } from '../hooks/useSyncedStorage';
import { theme } from '../theme';
import * as ImagePicker from 'expo-image-picker';

export default function AddCustomerScreen({ navigation }: any) {
  const { addCustomer } = useApp();
  const { getSchemes, getMinimumAmount, setMinimumAmount } = useSyncedStorage();
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [address, setAddress] = useState('');
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [minimumAmount, setMinimumAmount] = useState(0);
  const [selectedMonths, setSelectedMonths] = useState<number>(11);
  const [monthlyEmi, setMonthlyEmi] = useState('');
  const [startDate, setStartDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [saving, setSaving] = useState(false);
  const [documentUri, setDocumentUri] = useState<string | null>(null);
  const [documentBase64, setDocumentBase64] = useState<string | null>(null);

  useEffect(() => {
    getSchemes().then(setSchemes);
    getMinimumAmount().then(setMinimumAmount);
  }, [getSchemes, getMinimumAmount]);

  const submit = async () => {
    const amount = parseInt(monthlyEmi, 10);
    if (!name.trim() || !mobile.trim() || !amount || amount <= 0) {
      Alert.alert('Error', 'Please enter name, mobile and valid EMI amount.');
      return;
    }
    if (minimumAmount > 0 && amount < minimumAmount) {
      Alert.alert(
        'Minimum amount',
        `Monthly EMI cannot be less than ₹${minimumAmount.toLocaleString('en-IN')} (set in Settings).`
      );
      return;
    }
    setSaving(true);
    try {
      const pin = generateCustomerPin();
      const id = `cust-${Date.now()}`;
      const now = new Date().toISOString();
      const installments = generateInstallments(selectedMonths as 5 | 11, amount, startDate);
      const customer: Customer = {
        id,
        name: name.trim(),
        mobile: mobile.trim(),
        whatsappNumber: whatsappNumber.trim() || undefined,
        address: address.trim() || undefined,
        idProofUrl: documentBase64 || documentUri || undefined,
        customerPin: pin,
        schemeType: selectedMonths as 5 | 11,
        monthlyEmiAmount: amount,
        startDate,
        installments,
        status: 'active',
        documentStatus: 'pending',
        createdAt: now,
        updatedAt: now,
      };
      await addCustomer(customer);
      if (amount >= minimumAmount) {
        await setMinimumAmount(amount);
      }
      scheduleRemindersForCustomer(customer).catch(() => {});

      const sendTo = (whatsappNumber.trim() || mobile.trim()).replace(/\D/g, '');
      const message = getCustomerPinWhatsAppMessage(name.trim(), pin, mobile.trim());
      const waUrl = sendTo ? `https://wa.me/91${sendTo}?text=${encodeURIComponent(message)}` : null;
      Alert.alert(
        'Customer added',
        `PIN for ${name.trim()}: ${pin}\n\n${waUrl ? 'Tap "Open WhatsApp" to send login details to customer.' : 'Share the PIN via WhatsApp manually.'}`,
        [
          { text: 'OK', onPress: () => navigation.goBack() },
          ...(waUrl
            ? [
                {
                  text: 'Open WhatsApp',
                  onPress: () => {
                    Linking.openURL(waUrl).catch(() => {});
                    navigation.goBack();
                  },
                },
              ]
            : []),
          {
            text: 'Share',
            onPress: () => {
              Share.share({ message, title: 'Ganesh Jewellers – Your Login PIN' }).finally(() => navigation.goBack());
            },
          },
        ]
      );
    } catch (e: any) {
      const msg = e?.message || e?.toString?.() || 'Could not save customer.';
      Alert.alert(
        'Save failed',
        msg + (msg.includes('Unauthorized') || msg.includes('401') ? '\n\nLog out and log in again with PIN 1234 (Owner) so the app can sync with the server.' : '')
      );
    } finally {
      setSaving(false);
    }
  };

  const schemeOptions = schemes.length > 0
    ? schemes
    : [{ id: '5', name: '5 Months', months: 5 }, { id: '11', name: '11 Months', months: 11 }];

  const pickImage = async (useCamera: boolean) => {
    const { status } = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow camera or photo library access to add a document.');
      return;
    }
    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7, base64: true })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, base64: true });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setDocumentUri(asset.uri);
    setDocumentBase64(asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : null);
  };

  const clearDocument = () => {
    setDocumentUri(null);
    setDocumentBase64(null);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Add Customer</Text>
        {minimumAmount > 0 && (
          <Text style={styles.hint}>Min. EMI: ₹{minimumAmount.toLocaleString('en-IN')} (Settings)</Text>
        )}

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

        <Text style={styles.label}>WhatsApp number (for sending login PIN)</Text>
        <TextInput
          style={styles.input}
          value={whatsappNumber}
          onChangeText={setWhatsappNumber}
          placeholder="Same as mobile or different"
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

        <Text style={styles.label}>Document (ID proof / optional)</Text>
        <View style={styles.documentRow}>
          <TouchableOpacity style={styles.docButton} onPress={() => pickImage(true)} activeOpacity={0.8}>
            <Text style={styles.docButtonText}>📷 Take photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.docButton} onPress={() => pickImage(false)} activeOpacity={0.8}>
            <Text style={styles.docButtonText}>📁 Choose file</Text>
          </TouchableOpacity>
        </View>
        {(documentUri || documentBase64) && (
          <View style={styles.documentPreview}>
            <Text style={styles.documentPreviewText}>Document attached</Text>
            <TouchableOpacity onPress={clearDocument} style={styles.clearDoc}>
              <Text style={styles.clearDocText}>Remove</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.label}>Scheme</Text>
        <View style={styles.schemeRow}>
          {schemeOptions.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={[styles.schemeBtn, selectedMonths === s.months && styles.schemeBtnActive]}
              onPress={() => setSelectedMonths(s.months)}
            >
              <Text style={[styles.schemeBtnText, selectedMonths === s.months && styles.schemeBtnTextActive]}>
                {s.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Monthly EMI (₹) *</Text>
        <TextInput
          style={styles.input}
          value={monthlyEmi}
          onChangeText={setMonthlyEmi}
          placeholder="e.g. 5000"
          keyboardType="number-pad"
          placeholderTextColor={theme.colors.textSecondary}
        />

        <Text style={styles.label}>Start date</Text>
        <TextInput
          style={styles.input}
          value={startDate}
          onChangeText={setStartDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={theme.colors.textSecondary}
        />

        <Text style={styles.pinHint}>PIN will be auto-generated and you can share it via WhatsApp after saving.</Text>

        <TouchableOpacity
          style={styles.submit}
          onPress={submit}
          activeOpacity={0.8}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>Save Customer</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { padding: theme.spacing.lg, paddingBottom: 40 },
  title: { ...theme.typography.title, marginBottom: theme.spacing.lg },
  hint: { ...theme.typography.caption, color: theme.colors.primary, marginBottom: 8 },
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
  schemeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginVertical: 8 },
  schemeBtn: {
    minWidth: 100,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  schemeBtnActive: { borderColor: theme.colors.primary, backgroundColor: theme.colors.card },
  schemeBtnText: { ...theme.typography.body, color: theme.colors.textSecondary },
  schemeBtnTextActive: { color: theme.colors.primary, fontWeight: '600' },
  pinHint: { ...theme.typography.caption, color: theme.colors.textSecondary, marginTop: 12 },
  documentRow: { flexDirection: 'row', gap: 12, marginVertical: 8 },
  docButton: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  docButtonText: { ...theme.typography.body },
  documentPreview: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  documentPreviewText: { ...theme.typography.caption, color: theme.colors.paid },
  clearDoc: { padding: 4 },
  clearDocText: { ...theme.typography.caption, color: theme.colors.overdue },
  submit: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    marginTop: theme.spacing.xl,
  },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
