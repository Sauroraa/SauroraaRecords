import { Platform } from "react-native";

const memoryStore = new Map<string, string>();

export async function storageGet(key: string): Promise<string | null> {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return window.localStorage.getItem(key);
  }

  return memoryStore.get(key) ?? null;
}

export async function storageSet(key: string, value: string): Promise<void> {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.localStorage.setItem(key, value);
    return;
  }

  memoryStore.set(key, value);
}

export async function storageRemove(key: string): Promise<void> {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.localStorage.removeItem(key);
    return;
  }

  memoryStore.delete(key);
}
