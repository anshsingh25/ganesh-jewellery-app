import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView, Share, Platform } from 'react-native';
import { theme } from '../theme';

interface Props {
  visible: boolean;
  receiptText: string;
  onClose: () => void;
}

export default function ReceiptModal({ visible, receiptText, onClose }: Props) {
  const share = async () => {
    try {
      await Share.share({ message: receiptText, title: 'Ganesh Jewellers – EMI Receipt' });
    } catch (_) {}
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <ScrollView style={styles.scroll}>
            <Text style={styles.pre}>{receiptText}</Text>
          </ScrollView>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.shareBtn} onPress={share}>
              <Text style={styles.shareBtnText}>Share / WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  modal: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    maxHeight: '80%',
  },
  scroll: { padding: theme.spacing.lg, maxHeight: 400 },
  pre: {
    fontFamily: Platform?.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
    color: theme.colors.text,
  },
  actions: { flexDirection: 'row', padding: theme.spacing.md, gap: 12 },
  shareBtn: {
    flex: 1,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    alignItems: 'center',
  },
  shareBtnText: { color: '#fff', fontWeight: '600' },
  closeBtn: {
    flex: 1,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    alignItems: 'center',
  },
  closeBtnText: { color: theme.colors.text },
});
