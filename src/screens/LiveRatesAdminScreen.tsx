import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import * as api from '../services/api';
import { useApp } from '../context/AppContext';
import { theme } from '../theme';
import type { LiveRatesData, LiveRateBuySell, LiveRateBidAsk } from '../types';

type Tab = 'buy-sell' | 'bid-ask';

export default function LiveRatesAdminScreen({ navigation }: any) {
  const { apiBaseUrl, ownerToken } = useApp();
  const [data, setData] = useState<LiveRatesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('buy-sell');
  const [modal, setModal] = useState<'buy-sell' | 'bid-ask' | null>(null);
  const [saving, setSaving] = useState(false);
  const [editBuySell, setEditBuySell] = useState<LiveRateBuySell | null>(null);
  const [editBidAsk, setEditBidAsk] = useState<LiveRateBidAsk | null>(null);
  const [formProduct, setFormProduct] = useState('');
  const [formBuy, setFormBuy] = useState('');
  const [formSell, setFormSell] = useState('');
  const [formBid, setFormBid] = useState('');
  const [formAsk, setFormAsk] = useState('');
  const [formHigh, setFormHigh] = useState('');
  const [formLow, setFormLow] = useState('');

  const load = useCallback(async () => {
    if (!apiBaseUrl) {
      setData({ buySell: [], bidAsk: [] });
      setLoading(false);
      return;
    }
    try {
      const next = await api.getLiveRates(apiBaseUrl);
      setData(next);
    } catch {
      setData({ buySell: [], bidAsk: [] });
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl]);

  React.useEffect(() => {
    load();
  }, [load]);

  const openAddBuySell = () => {
    setEditBuySell(null);
    setFormProduct('');
    setFormBuy('');
    setFormSell('');
    setModal('buy-sell');
  };

  const openAddBidAsk = () => {
    setEditBidAsk(null);
    setFormProduct('');
    setFormBid('');
    setFormAsk('');
    setFormHigh('');
    setFormLow('');
    setModal('bid-ask');
  };

  const openEditBuySell = (row: LiveRateBuySell) => {
    setEditBuySell(row);
    setFormProduct(row.product);
    setFormBuy(row.buyValue ?? '');
    setFormSell(row.sellValue ?? '');
    setModal('buy-sell');
  };

  const openEditBidAsk = (row: LiveRateBidAsk) => {
    setEditBidAsk(row);
    setFormProduct(row.product);
    setFormBid(row.bid ?? '');
    setFormAsk(row.ask ?? '');
    setFormHigh(row.high ?? '');
    setFormLow(row.low ?? '');
    setModal('bid-ask');
  };

  const saveBuySell = async () => {
    const product = formProduct.trim();
    const sellValue = formSell.trim();
    if (!product || sellValue === '') {
      Alert.alert('Required', 'Product and Sell are required.');
      return;
    }
    if (!apiBaseUrl || !ownerToken) {
      Alert.alert('Not connected', 'Server URL and owner login required.');
      return;
    }
    setSaving(true);
    try {
      if (editBuySell) {
        await api.updateLiveRateBuySell(apiBaseUrl, ownerToken, editBuySell.id, {
          product,
          buyValue: formBuy.trim() || undefined,
          sellValue,
        });
      } else {
        await api.addLiveRateBuySell(apiBaseUrl, ownerToken, {
          product,
          buyValue: formBuy.trim() || undefined,
          sellValue,
        });
      }
      setModal(null);
      load();
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const saveBidAsk = async () => {
    const product = formProduct.trim();
    if (!product) {
      Alert.alert('Required', 'Product is required.');
      return;
    }
    if (!apiBaseUrl || !ownerToken) {
      Alert.alert('Not connected', 'Server URL and owner login required.');
      return;
    }
    setSaving(true);
    try {
      if (editBidAsk) {
        await api.updateLiveRateBidAsk(apiBaseUrl, ownerToken, editBidAsk.id, {
          product,
          bid: formBid.trim() || undefined,
          ask: formAsk.trim() || undefined,
          high: formHigh.trim() || undefined,
          low: formLow.trim() || undefined,
        });
      } else {
        await api.addLiveRateBidAsk(apiBaseUrl, ownerToken, {
          product,
          bid: formBid.trim() || undefined,
          ask: formAsk.trim() || undefined,
          high: formHigh.trim() || undefined,
          low: formLow.trim() || undefined,
        });
      }
      setModal(null);
      load();
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const deleteBuySell = (row: LiveRateBuySell) => {
    Alert.alert('Delete', `Remove "${row.product}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!apiBaseUrl || !ownerToken) return;
          try {
            await api.deleteLiveRateBuySell(apiBaseUrl, ownerToken, row.id);
            load();
          } catch (e: unknown) {
            Alert.alert('Error', e instanceof Error ? e.message : 'Failed to delete');
          }
        },
      },
    ]);
  };

  const deleteBidAsk = (row: LiveRateBidAsk) => {
    Alert.alert('Delete', `Remove "${row.product}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!apiBaseUrl || !ownerToken) return;
          try {
            await api.deleteLiveRateBidAsk(apiBaseUrl, ownerToken, row.id);
            load();
          } catch (e: unknown) {
            Alert.alert('Error', e instanceof Error ? e.message : 'Failed to delete');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const buySell = data?.buySell ?? [];
  const bidAsk = data?.bidAsk ?? [];

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'buy-sell' && styles.tabActive]}
          onPress={() => setTab('buy-sell')}
        >
          <Text style={[styles.tabText, tab === 'buy-sell' && styles.tabTextActive]}>Buy / Sell</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'bid-ask' && styles.tabActive]}
          onPress={() => setTab('bid-ask')}
        >
          <Text style={[styles.tabText, tab === 'bid-ask' && styles.tabTextActive]}>Bid / Ask</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {tab === 'buy-sell' && (
          <>
            <TouchableOpacity style={styles.addBtn} onPress={openAddBuySell}>
              <Text style={styles.addBtnText}>+ Add Buy/Sell row</Text>
            </TouchableOpacity>
            {buySell.map((r) => (
              <View key={r.id} style={styles.row}>
                <Text style={styles.rowProduct} numberOfLines={1}>{r.product}</Text>
                <Text style={styles.rowVal}>Buy: {r.buyValue ?? '–'}  Sell: {r.sellValue}</Text>
                <View style={styles.rowActions}>
                  <TouchableOpacity onPress={() => openEditBuySell(r)}>
                    <Text style={styles.link}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteBuySell(r)}>
                    <Text style={styles.linkDanger}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            {buySell.length === 0 && (
              <Text style={styles.empty}>No Buy/Sell rates. Add one above.</Text>
            )}
          </>
        )}
        {tab === 'bid-ask' && (
          <>
            <TouchableOpacity style={styles.addBtn} onPress={openAddBidAsk}>
              <Text style={styles.addBtnText}>+ Add Bid/Ask row</Text>
            </TouchableOpacity>
            {bidAsk.map((r) => (
              <View key={r.id} style={styles.row}>
                <Text style={styles.rowProduct} numberOfLines={1}>{r.product}</Text>
                <Text style={styles.rowVal}>
                  Bid: {r.bid ?? '–'}  Ask: {r.ask ?? '–'}  H: {r.high ?? '–'}  L: {r.low ?? '–'}
                </Text>
                <View style={styles.rowActions}>
                  <TouchableOpacity onPress={() => openEditBidAsk(r)}>
                    <Text style={styles.link}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteBidAsk(r)}>
                    <Text style={styles.linkDanger}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            {bidAsk.length === 0 && (
              <Text style={styles.empty}>No Bid/Ask rates. Add one above.</Text>
            )}
          </>
        )}
      </ScrollView>

      <Modal visible={modal === 'buy-sell'} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{editBuySell ? 'Edit' : 'Add'} Buy/Sell</Text>
            <TextInput
              style={styles.input}
              value={formProduct}
              onChangeText={setFormProduct}
              placeholder="Product (e.g. GOLD 999 IMP T+2)"
              placeholderTextColor={theme.colors.textSecondary}
            />
            <TextInput
              style={styles.input}
              value={formBuy}
              onChangeText={setFormBuy}
              placeholder="Buy (optional)"
              placeholderTextColor={theme.colors.textSecondary}
            />
            <TextInput
              style={styles.input}
              value={formSell}
              onChangeText={setFormSell}
              placeholder="Sell *"
              placeholderTextColor={theme.colors.textSecondary}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnSecondary} onPress={() => setModal(null)}>
                <Text style={styles.modalBtnTextSecondary}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtn} onPress={saveBuySell} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalBtnText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={modal === 'bid-ask'} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{editBidAsk ? 'Edit' : 'Add'} Bid/Ask</Text>
            <TextInput
              style={styles.input}
              value={formProduct}
              onChangeText={setFormProduct}
              placeholder="Product (e.g. GOLD., SILVER)"
              placeholderTextColor={theme.colors.textSecondary}
            />
            <TextInput
              style={styles.input}
              value={formBid}
              onChangeText={setFormBid}
              placeholder="Bid"
              placeholderTextColor={theme.colors.textSecondary}
            />
            <TextInput
              style={styles.input}
              value={formAsk}
              onChangeText={setFormAsk}
              placeholder="Ask"
              placeholderTextColor={theme.colors.textSecondary}
            />
            <TextInput
              style={styles.input}
              value={formHigh}
              onChangeText={setFormHigh}
              placeholder="High"
              placeholderTextColor={theme.colors.textSecondary}
            />
            <TextInput
              style={styles.input}
              value={formLow}
              onChangeText={setFormLow}
              placeholder="Low"
              placeholderTextColor={theme.colors.textSecondary}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnSecondary} onPress={() => setModal(null)}>
                <Text style={styles.modalBtnTextSecondary}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtn} onPress={saveBidAsk} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalBtnText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabs: { flexDirection: 'row', backgroundColor: theme.colors.card, padding: theme.spacing.xs },
  tab: { flex: 1, paddingVertical: theme.spacing.sm, alignItems: 'center', borderRadius: theme.radius.sm },
  tabActive: { backgroundColor: theme.colors.primary },
  tabText: { ...theme.typography.subtitle, color: theme.colors.text },
  tabTextActive: { color: '#fff' },
  scroll: { flex: 1 },
  scrollContent: { padding: theme.spacing.lg, paddingBottom: 40 },
  addBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  addBtnText: { color: '#fff', fontWeight: '700' },
  row: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  rowProduct: { ...theme.typography.subtitle, marginBottom: 4 },
  rowVal: { ...theme.typography.caption, color: theme.colors.textSecondary, marginBottom: 8 },
  rowActions: { flexDirection: 'row', gap: theme.spacing.lg },
  link: { color: theme.colors.primary, fontWeight: '600' },
  linkDanger: { color: theme.colors.pending, fontWeight: '600' },
  empty: { ...theme.typography.body, color: theme.colors.textSecondary, textAlign: 'center', marginTop: theme.spacing.lg },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  modalBox: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.lg,
  },
  modalTitle: { ...theme.typography.title, marginBottom: theme.spacing.lg },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.text,
  },
  modalActions: { flexDirection: 'row', gap: theme.spacing.md, marginTop: theme.spacing.md },
  modalBtn: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
    alignItems: 'center',
  },
  modalBtnText: { color: '#fff', fontWeight: '700' },
  modalBtnSecondary: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalBtnTextSecondary: { color: theme.colors.text },
});
