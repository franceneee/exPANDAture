import "fake-indexeddb/auto";
import { beforeEach } from "vitest";

const storage = new Map();

globalThis.localStorage = {
  clear() {
    storage.clear();
  },
  getItem(key) {
    return storage.has(key) ? storage.get(key) : null;
  },
  removeItem(key) {
    storage.delete(key);
  },
  setItem(key, value) {
    storage.set(key, String(value));
  }
};

beforeEach(() => {
  localStorage.clear();
});
