import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SQLiteProvider } from 'expo-sqlite';
import type { SQLiteDatabase } from 'expo-sqlite';
import { setDb, runMigrations } from './src/services/db';
import { migrateIfNeeded } from './src/services/migrateFromAsyncStorage';
import { AppProvider } from './src/context/AppContext';
import AppNavigator from './src/navigation/AppNavigator';
import PaymentSuccessHandler from './src/components/PaymentSuccessHandler';
import DrizzleStudio from './src/components/DrizzleStudio';
import { ensureReminderNotificationsConfigured } from './src/services/reminders';

async function initDb(db: SQLiteDatabase) {
  setDb(db);
  await runMigrations(db);
  await migrateIfNeeded();
}

export default function App() {
  return (
    <SQLiteProvider databaseName="ganesh.db" onInit={initDb}>
      <SafeAreaProvider>
        <AppProvider>
          {(() => {
            useEffect(() => {
              ensureReminderNotificationsConfigured().catch(() => {});
            }, []);
            return null;
          })()}
          {__DEV__ ? <DrizzleStudio /> : null}
          <PaymentSuccessHandler />
          <StatusBar style="dark" />
          <AppNavigator />
        </AppProvider>
      </SafeAreaProvider>
    </SQLiteProvider>
  );
}
