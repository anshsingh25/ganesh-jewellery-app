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

export default function LoginScreen() {
  const { setUser, useApiMode, apiBaseUrl } = useApp();
  const [name, setName] = useState('Owner');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  const login = async () => {
    if (useApiMode && apiBaseUrl) {
      setLoading(true);
      try {
        const { token, user } = await api.ownerLogin(apiBaseUrl, name.trim() || 'Owner', pin);
        setUser(user, token);
      } catch (e: any) {
        Alert.alert('Login failed', e?.message || 'Invalid PIN or server error.');
      } finally {
        setLoading(false);
      }
    } else {
      setUser({
        id: '1',
        name: name.trim() || 'Owner',
        role: 'owner',
        pin: pin || undefined,
      });
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.logo}>🪙</Text>
        <Text style={styles.title}>Ganesh Jewellers</Text>
        <Text style={styles.subtitle}>EMI Management</Text>
        {useApiMode && apiBaseUrl ? (
          <Text style={styles.dbHint}>Log in to save and load all data from the database.</Text>
        ) : null}

        <TextInput
          style={styles.input}
          placeholder="Your name"
          value={name}
          onChangeText={setName}
          placeholderTextColor={theme.colors.textSecondary}
        />
        <TextInput
          style={styles.input}
          placeholder={useApiMode ? 'PIN (required)' : 'PIN (optional)'}
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
          disabled={loading || (useApiMode && !pin.trim())}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Enter</Text>
          )}
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
    alignItems: 'center',
    ...theme.shadows.lg,
  },
  logo: { fontSize: 44, marginBottom: theme.spacing.sm },
  title: {
    ...theme.typography.titleLarge,
    color: theme.colors.primaryDark,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  dbHint: {
    ...theme.typography.caption,
    color: theme.colors.primary,
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
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
