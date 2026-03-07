"use client";

import { openDB, type DBSchema, type IDBPDatabase } from "idb";

import { HISTORY_KEY, HISTORY_META_KEY } from "../model/page-constants";
import type { HistoryItem } from "../model/page-types";

const HISTORY_LIMIT = 30;
const DB_NAME = "txt-wwew-tech";
const DB_VERSION = 1;
const STORE_NAME = "home-history";
const STORE_KEY = "entries";

type HistoryMetaItem = Pick<HistoryItem, "id" | "title" | "updatedAt" | "tokenEstimate">;

interface HistoryDbSchema extends DBSchema {
  [STORE_NAME]: {
    key: string;
    value: HistoryItem[];
  };
}

let dbPromise: Promise<IDBPDatabase<HistoryDbSchema>> | null = null;

function isIndexedDbAvailable() {
  return typeof window !== "undefined" && "indexedDB" in window;
}

function getDb() {
  if (!isIndexedDbAvailable()) {
    return null;
  }

  if (!dbPromise) {
    dbPromise = openDB<HistoryDbSchema>(DB_NAME, DB_VERSION, {
      upgrade(database) {
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME);
        }
      },
    });
  }

  return dbPromise;
}

function toMeta(history: HistoryItem[]): HistoryMetaItem[] {
  return history.map(({ id, title, updatedAt, tokenEstimate }) => ({
    id,
    title,
    updatedAt,
    tokenEstimate,
  }));
}

function persistHistoryMeta(history: HistoryItem[]) {
  try {
    window.localStorage.setItem(HISTORY_META_KEY, JSON.stringify(toMeta(history)));
  } catch {
    // no-op
  }
}

async function readHistoryFromIndexedDb(): Promise<HistoryItem[] | null> {
  try {
    const database = await getDb();
    if (!database) return null;
    const value = await database.get(STORE_NAME, STORE_KEY);
    if (!Array.isArray(value)) return [];
    return value.slice(0, HISTORY_LIMIT);
  } catch {
    return null;
  }
}

function readLegacyHistoryFromLocalStorage(): HistoryItem[] {
  const raw = window.localStorage.getItem(HISTORY_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, HISTORY_LIMIT) as HistoryItem[];
  } catch {
    return [];
  }
}

export async function loadHistoryStorage(): Promise<HistoryItem[]> {
  const indexedDbHistory = await readHistoryFromIndexedDb();
  if (indexedDbHistory && indexedDbHistory.length > 0) {
    return indexedDbHistory;
  }

  const legacyHistory = readLegacyHistoryFromLocalStorage();
  if (legacyHistory.length) {
    await saveHistoryStorage(legacyHistory);
    window.localStorage.removeItem(HISTORY_KEY);
    return legacyHistory;
  }
  window.localStorage.removeItem(HISTORY_KEY);

  if (indexedDbHistory) {
    return indexedDbHistory;
  }

  return [];
}

export async function saveHistoryStorage(history: HistoryItem[]): Promise<void> {
  const nextHistory = history.slice(0, HISTORY_LIMIT);

  persistHistoryMeta(nextHistory);

  try {
    const database = await getDb();
    if (!database) return;
    await database.put(STORE_NAME, nextHistory, STORE_KEY);
  } catch {
    // no-op
  }
}
