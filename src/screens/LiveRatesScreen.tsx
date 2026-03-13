import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, RefreshControl, ScrollView, ActivityIndicator } from 'react-native';
import * as api from '../services/api';
import * as storage from '../services/storage';
import { useApp } from '../context/AppContext';
import { theme } from '../theme';
import type { LiveRatesData, LiveRateBuySell, LiveRateBidAsk } from '../types';

function BuySellTable({ rows }: { rows: LiveRateBuySell[] }) {
  if (!rows.length) return null;
  return (
    <View style={styles.tableCard}>
      <View style={styles.tableHeaderRow}>
        <Text style={[styles.th, styles.colProduct]}>Product</Text>
        <Text style={[styles.th, styles.colNum]}>Buy</Text>
        <Text style={[styles.th, styles.colNum]}>Sell</Text>
      </View>
      {rows.map((r) => (
        <View key={r.id} style={styles.tableRow}>
          <Text style={[styles.td, styles.colProduct]} numberOfLines={1}>{r.product}</Text>
          <Text style={[styles.td, styles.colNum]}>{r.buyValue ?? '–'}</Text>
          <Text style={[styles.td, styles.colNum]}>{r.sellValue ?? '–'}</Text>
        </View>
      ))}
    </View>
  );
}

function BidAskTable({ rows }: { rows: LiveRateBidAsk[] }) {
  if (!rows.length) return null;
  return (
    <View style={styles.tableCard}>
      <View style={styles.tableHeaderRow}>
        <Text style={[styles.th, styles.colProduct]}>Product</Text>
        <Text style={[styles.th, styles.colNum]}>Bid</Text>
        <Text style={[styles.th, styles.colNum]}>Ask</Text>
        <Text style={[styles.th, styles.colHL]}>H / L</Text>
      </View>
      {rows.map((r) => (
        <View key={r.id} style={styles.tableRow}>
          <Text style={[styles.td, styles.colProduct]} numberOfLines={1}>{r.product}</Text>
          <Text style={[styles.td, styles.colNum]}>{r.bid ?? '–'}</Text>
          <Text style={[styles.td, styles.colNum]}>{r.ask ?? '–'}</Text>
          <Text style={[styles.td, styles.colHL]}>
            {[r.high, r.low].some(Boolean) ? `H - ${r.high ?? '–'} L - ${r.low ?? '–'}` : '–'}
          </Text>
        </View>
      ))}
    </View>
  );
}

export default function LiveRatesScreen() {
  const { apiBaseUrl } = useApp();
  const [data, setData] = useState<LiveRatesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const base = (apiBaseUrl || (await storage.getPaymentApiUrl()) || '').trim().replace(/\/$/, '');
    if (!base) {
      setError('Set Server URL in Settings to load live rates.');
      setData({ buySell: [], bidAsk: [] });
      setLoading(false);
      setRefreshing(false);
      return;
    }
    setError(null);
    try {
      const next = await api.getLiveRates(base);
      setData(next);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load live rates');
      setData({ buySell: [], bidAsk: [] });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [apiBaseUrl]);

  React.useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  if (loading && !data) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading live rates…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
      }
    >
      <Text style={styles.title}>Live Rates</Text>
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : null}
      <BuySellTable rows={data?.buySell ?? []} />
      <BidAskTable rows={data?.bidAsk ?? []} />
      {data && !data.buySell.length && !data.bidAsk.length && !error && (
        <Text style={styles.empty}>No rates yet. Add them from Settings → Manage Live Rates.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: theme.colors.background },
  container: { padding: theme.spacing.lg, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background },
  loadingText: { marginTop: theme.spacing.md, ...theme.typography.body, color: theme.colors.textSecondary },
  title: { ...theme.typography.titleLarge, marginBottom: theme.spacing.lg, color: theme.colors.text },
  error: { ...theme.typography.body, color: theme.colors.pending, marginBottom: theme.spacing.md },
  empty: { ...theme.typography.body, color: theme.colors.textSecondary, textAlign: 'center', marginTop: theme.spacing.xl },
  tableCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.lg,
    overflow: 'hidden',
    ...theme.shadows.sm,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  th: { color: '#fff', fontWeight: '700', fontSize: 13 },
  td: { ...theme.typography.body, color: theme.colors.text, fontSize: 14 },
  colProduct: { flex: 1.8 },
  colNum: { width: 72, textAlign: 'right' },
  colHL: { flex: 1.2, fontSize: 12, textAlign: 'right' },
});
