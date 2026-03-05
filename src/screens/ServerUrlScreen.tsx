/**
 * Change Server URL when logged out (e.g. after login failed).
 * Saves to storage and refreshes context so Login screen uses the new URL.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import * as storage from '../services/storage';
import { useApp } from '../context/AppContext';
import { theme } from '../theme';

export default function ServerUrlScreen({ navigation }: any) {
  const { refreshServerUrl } = useApp();
  const [url, setUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    storage.getPaymentApiUrl().then(setUrl);
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await storage.setPaymentApiUrl(url);
      await refreshServerUrl();
      Alert.alert('Saved', 'Server URL updated. Go back and try logging in with PIN 1234.');
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not save.');
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    const base = url.trim().replace(/\/$/, '');
    if (!base) {
      Alert.alert('No URL', 'Enter the server URL first (e.g. https://your-app.up.railway.app).');
      return;
    }
    setTesting(true);
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(base + '/', { method: 'GET', signal: controller.signal });
      clearTimeout(t);
      if (res.ok || res.status === 200) {
        Alert.alert('Connection OK', 'This device can reach the server. Save and log in with PIN 1234.');
      } else {
        Alert.alert('Unexpected response', `Server returned ${res.status}. Check the URL.`);
      }
    } catch (e: any) {
      Alert.alert(
        'Cannot reach server',
        (e?.message || String(e)) + '\n\nUse https://. Try Wi‑Fi if 4G fails. Open the URL in Safari to confirm.'
      );
    } finally {
      setTesting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Server URL</Text>
      <Text style={styles.hint}>Backend address for sync and login. Use https:// (e.g. https://your-app.up.railway.app).</Text>
      <TextInput
        style={styles.input}
        value={url}
        onChangeText={setUrl}
        placeholder="https://..."
        autoCapitalize="none"
        placeholderTextColor={theme.colors.textSecondary}
      />
      <TouchableOpacity style={styles.button} onPress={save} disabled={saving} activeOpacity={0.8}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save and go back</Text>}
      </TouchableOpacity>
      <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={testConnection} disabled={testing} activeOpacity={0.8}>
        {testing ? <ActivityIndicator color={theme.colors.primary} /> : <Text style={styles.buttonTextSecondary}>Test connection</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: theme.spacing.lg, backgroundColor: theme.colors.background },
  title: { ...theme.typography.titleLarge, marginBottom: theme.spacing.sm, color: theme.colors.text },
  hint: { ...theme.typography.caption, color: theme.colors.textSecondary, marginBottom: theme.spacing.lg },
  input: {
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  buttonSecondary: { backgroundColor: 'transparent', borderWidth: 2, borderColor: theme.colors.primary },
  buttonTextSecondary: { color: theme.colors.primary, fontWeight: '700', fontSize: 16 },
});
