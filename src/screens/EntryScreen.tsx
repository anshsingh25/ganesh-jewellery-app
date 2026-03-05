import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../theme';

export default function EntryScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <View style={styles.logoWrap}>
          <Text style={styles.logo}>✨</Text>
        </View>
        <Text style={styles.title}>Ganesh Jewellers</Text>
        <Text style={styles.subtitle}>EMI & Scheme Management</Text>
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity
          style={[styles.button, styles.buttonOwner]}
          onPress={() => navigation.navigate('OwnerLogin')}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonIcon}>🏪</Text>
          <Text style={styles.buttonTitle}>Owner / Staff</Text>
          <Text style={styles.buttonSubtitle}>Manage shop, add customers, track EMI</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonCustomer]}
          onPress={() => navigation.navigate('CustomerLogin')}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonIcon}>👤</Text>
          <Text style={styles.buttonTitle}>Customer</Text>
          <Text style={styles.buttonSubtitle}>View my EMI, receipts & due dates</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xxl,
    paddingBottom: theme.spacing.xl,
  },
  hero: {
    alignItems: 'center',
  },
  logoWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
    borderWidth: 2,
    borderColor: theme.colors.primary + '30',
    ...theme.shadows.md,
  },
  logo: { fontSize: 40 },
  title: {
    ...theme.typography.titleLarge,
    color: theme.colors.primaryDark,
    textAlign: 'center',
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  buttons: {
    width: '100%',
    maxWidth: 340,
    gap: theme.spacing.md,
  },
  button: {
    width: '100%',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    borderWidth: 2,
    ...theme.shadows.sm,
  },
  buttonOwner: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.primary,
  },
  buttonCustomer: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
  },
  buttonIcon: { fontSize: 32, marginBottom: theme.spacing.sm },
  buttonTitle: { ...theme.typography.subtitle, fontSize: 18, color: theme.colors.text },
  buttonSubtitle: { ...theme.typography.caption, color: theme.colors.textSecondary, marginTop: 4 },
});
