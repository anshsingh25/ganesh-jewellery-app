import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { theme } from '../theme';

/**
 * Owner panel: Payment methods available for customers.
 * Shows Razorpay (UPI, Debit/Credit Card) and setup info.
 */
export default function PaymentMethodsScreen() {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Payment methods</Text>
      <Text style={styles.subtitle}>Customers can pay their EMI using these options when you enable them.</Text>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Razorpay</Text>
          <Text style={styles.badge}>UPI · Debit/Credit Card</Text>
        </View>
        <Text style={styles.cardDesc}>
          Customers can pay online via UPI, debit card, or credit card. They will see a "Pay with UPI / Card" button on their EMI screen.
        </Text>
        <View style={styles.setupBox}>
          <Text style={styles.setupTitle}>To enable:</Text>
          <Text style={styles.setupStep}>1. Set Server URL in Settings (your backend address).</Text>
          <Text style={styles.setupStep}>2. On your server, add Razorpay keys in .env:</Text>
          <Text style={styles.setupCode}>RAZORPAY_KEY_ID=your_key_id</Text>
          <Text style={styles.setupCode}>RAZORPAY_KEY_SECRET=your_key_secret</Text>
          <Text style={styles.setupStep}>3. Get keys from dashboard.razorpay.com</Text>
        </View>
      </View>

      <View style={styles.note}>
        <Text style={styles.noteText}>
          Customers also have "I paid at shop" to record cash/other payments without going through Razorpay.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: theme.colors.background },
  container: { padding: theme.spacing.lg, paddingBottom: 40 },
  title: { ...theme.typography.title, marginBottom: 8 },
  subtitle: { ...theme.typography.body, color: theme.colors.textSecondary, marginBottom: theme.spacing.xl },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: 8 },
  cardTitle: { ...theme.typography.subtitle, fontSize: 18 },
  badge: { ...theme.typography.caption, color: theme.colors.primary, fontWeight: '600' },
  cardDesc: { ...theme.typography.body, color: theme.colors.text, marginBottom: theme.spacing.md },
  setupBox: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  setupTitle: { ...theme.typography.caption, fontWeight: '600', marginBottom: 8 },
  setupStep: { ...theme.typography.body, color: theme.colors.text, marginBottom: 4 },
  setupCode: { ...theme.typography.caption, fontFamily: 'monospace', marginLeft: 8, marginBottom: 2 },
  note: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
  },
  noteText: { ...theme.typography.caption, color: theme.colors.textSecondary },
});
