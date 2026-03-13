/**
 * Reminder scheduling for EMI due dates.
 * Uses expo-notifications for in-app reminders.
 * SMS/WhatsApp would be added via backend (Twilio, WhatsApp Business API).
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Customer } from '../types';
import { getNextUnpaidInstallment } from '../utils/emiLogic';
import { getReminderMessage } from '../utils/receipt';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function scheduleRemindersForCustomer(customer: Customer): Promise<void> {
  const next = getNextUnpaidInstallment(customer.installments);
  if (!next) return;

  const due = new Date(next.dueDate);
  const twoDaysBefore = new Date(due);
  twoDaysBefore.setDate(twoDaysBefore.getDate() - 2);

  const title = 'EMI Reminder – Ganesh Jewellers';
  const body = getReminderMessage(customer, next);

  // Schedule 2 days before
  if (twoDaysBefore > new Date()) {
    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: { date: twoDaysBefore, channelId: 'emi-reminders' },
    });
  }
  // Schedule on due date
  if (due > new Date()) {
    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: { date: due, channelId: 'emi-reminders' },
    });
  }
}

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/** Call once on app startup to ensure channel + permissions exist. */
export async function ensureReminderNotificationsConfigured(): Promise<void> {
  const granted = await requestNotificationPermissions();
  if (!granted) return;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('emi-reminders', {
      name: 'EMI Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
  }
}
