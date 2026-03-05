import { useDrizzleStudio } from 'expo-drizzle-studio-plugin';
import { useSQLiteContext } from 'expo-sqlite';

export default function DrizzleStudio() {
  const db = useSQLiteContext();
  useDrizzleStudio(db);
  return null;
}

