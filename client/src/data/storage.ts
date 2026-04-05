// ─── LocalStorage persistence layer for BVM Campus Management demo ───
// Provides get/set for each data collection, with JSON serialization.
// On first load, returns null (so mockData uses initial seed data).
// After any mutation, the full collection is persisted.

const STORAGE_PREFIX = 'bvm_';

function getItem<T>(key: string): T | null {
    try {
        const raw = localStorage.getItem(STORAGE_PREFIX + key);
        if (raw === null) return null;
        return JSON.parse(raw) as T;
    } catch {
        return null;
    }
}

function setItem<T>(key: string, data: T): void {
    try {
        localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
    } catch {
        // localStorage full or unavailable — silently ignore
    }
}

/** Load a collection from localStorage, falling back to initial seed data */
export function loadCollection<T>(key: string, seed: T): T {
    const stored = getItem<T>(key);
    if (stored !== null) return stored;
    // First time — persist the seed data
    setItem(key, seed);
    return seed;
}

/** Save a collection to localStorage */
export function saveCollection<T>(key: string, data: T): void {
    setItem(key, data);
}

/** Clear all BVM Campus Management data from localStorage (for reset) */
export function clearAllBVMData(): void {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(STORAGE_PREFIX));
    keys.forEach(k => localStorage.removeItem(k));
}
