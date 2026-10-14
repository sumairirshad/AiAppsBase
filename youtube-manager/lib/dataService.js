// Single service layer the app talks to. It checks USE_MOCK_DATA and
// delegates to either the mock data or the local JSON store, so the rest
// of the app never has to know which one is active.

import {
  getMockEntries,
  addMockEntry,
  getMockEntry,
  updateMockEntry,
} from "./mockData";
import {
  getRealEntries,
  addRealEntry,
  getRealEntry,
  updateRealEntry,
} from "./realData";

function useMock() {
  return process.env.USE_MOCK_DATA === "true";
}

export function getEntries(category) {
  return useMock() ? getMockEntries(category) : getRealEntries(category);
}

export function getEntry(category, id) {
  return useMock() ? getMockEntry(category, id) : getRealEntry(category, id);
}

export function addEntry(category, entry) {
  return useMock() ? addMockEntry(category, entry) : addRealEntry(category, entry);
}

export function updateEntry(category, id, updates) {
  return useMock()
    ? updateMockEntry(category, id, updates)
    : updateRealEntry(category, id, updates);
}
