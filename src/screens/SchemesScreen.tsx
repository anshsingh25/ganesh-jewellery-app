import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  Modal,
} from 'react-native';
import type { Scheme } from '../types';
import { useSyncedStorage } from '../hooks/useSyncedStorage';
import { theme } from '../theme';

export default function SchemesScreen({ navigation }: any) {
  const { getAllSchemes, addScheme, updateScheme, deleteScheme } = useSyncedStorage();
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Scheme | null>(null);
  const [name, setName] = useState('');
  const [months, setMonths] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    getAllSchemes().then(setSchemes);
  }, [getAllSchemes]);

  useEffect(() => {
    load();
  }, [load]);

  const openAdd = () => {
    setEditing(null);
    setName('');
    setMonths('');
    setModalVisible(true);
  };

  const openEdit = (s: Scheme) => {
    setEditing(s);
    setName(s.name);
    setMonths(String(s.months));
    setModalVisible(true);
  };

  const save = async () => {
    const monthsNum = parseInt(months, 10);
    if (!name.trim() || !monthsNum || monthsNum < 1) {
      Alert.alert('Error', 'Enter scheme name and valid months (e.g. 12).');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateScheme({
          ...editing,
          name: name.trim(),
          months: monthsNum,
        });
      } else {
        const id = `scheme-${Date.now()}`;
        await addScheme({
          id,
          name: name.trim(),
          months: monthsNum,
          isActive: true,
        });
      }
      setModalVisible(false);
      setName('');
      setMonths('');
      load();
    } catch (e: any) {
      Alert.alert(
        'Could not save scheme',
        e?.message || 'Something went wrong. Try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const deactivate = (s: Scheme) => {
    Alert.alert(
      'Deactivate scheme',
      `Deactivate "${s.name}"? Customers already on this scheme are not affected.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Deactivate', style: 'destructive', onPress: async () => {
          await deleteScheme(s.id);
          load();
        }},
      ]
    );
  };

  const activate = async (s: Scheme) => {
    try {
      await updateScheme({ ...s, isActive: true });
      load();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not activate scheme.');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.addBtn} onPress={openAdd} activeOpacity={0.8}>
        <Text style={styles.addBtnText}>+ Add scheme</Text>
      </TouchableOpacity>
      <FlatList
        data={schemes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={[styles.row, !item.isActive && styles.rowInactive]}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowName}>{item.name}</Text>
              <Text style={styles.rowMonths}>
                {item.months} months{!item.isActive ? ' · Inactive' : ''}
              </Text>
            </View>
            <View style={styles.rowRight}>
              <TouchableOpacity onPress={() => openEdit(item)} style={styles.smallBtn}>
                <Text style={styles.smallBtnText}>Edit</Text>
              </TouchableOpacity>
              {item.isActive ? (
                <TouchableOpacity onPress={() => deactivate(item)} style={[styles.smallBtn, styles.deactivateBtn]}>
                  <Text style={styles.deactivateText}>Off</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={() => activate(item)} style={[styles.smallBtn, styles.activateBtn]}>
                  <Text style={styles.activateText}>On</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      />

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{editing ? 'Edit scheme' : 'Add scheme'}</Text>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. 6 Months"
              placeholderTextColor={theme.colors.textSecondary}
            />
            <Text style={styles.label}>Months</Text>
            <TextInput
              style={styles.input}
              value={months}
              onChangeText={setMonths}
              placeholder="e.g. 6"
              keyboardType="number-pad"
              placeholderTextColor={theme.colors.textSecondary}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
                disabled={saving}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={save}
                disabled={saving}
              >
                <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save'}</Text>
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
  addBtn: {
    margin: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    alignItems: 'center',
  },
  addBtnText: { color: '#fff', fontWeight: '700' },
  list: { padding: theme.spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.sm,
  },
  rowLeft: {},
  rowName: { ...theme.typography.subtitle },
  rowMonths: { ...theme.typography.caption, color: theme.colors.textSecondary, marginTop: 2 },
  rowRight: { flexDirection: 'row', gap: 8 },
  smallBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  smallBtnText: { color: theme.colors.primary, fontWeight: '600' },
  deactivateBtn: {},
  deactivateText: { color: theme.colors.overdue, fontWeight: '600' },
  activateBtn: {},
  activateText: { color: theme.colors.primary, fontWeight: '600' },
  rowInactive: { opacity: 0.85 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
    padding: theme.spacing.lg,
  },
  modalTitle: { ...theme.typography.title, marginBottom: theme.spacing.md },
  label: { ...theme.typography.caption, color: theme.colors.textSecondary, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.text,
  },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: theme.spacing.md },
  cancelBtn: {
    flex: 1,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    alignItems: 'center',
  },
  cancelBtnText: { color: theme.colors.text },
  saveBtn: {
    flex: 1,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: '700' },
});
