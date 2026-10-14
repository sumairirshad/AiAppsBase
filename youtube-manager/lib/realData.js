// Stand-in for the real data source. For now it reads/writes a local JSON
// file; later this can be swapped for real YouTube API calls without
// changing the function signatures used by dataService.js.

import fs from "fs";
import path from "path";
import { CATEGORIES } from "./categories";

const DB_PATH = path.join(process.cwd(), "data", "db.json");

function readDb() {
  if (!fs.existsSync(DB_PATH)) {
    const empty = Object.fromEntries(CATEGORIES.map((c) => [c.slug, []]));
    writeDb(empty);
    return empty;
  }
  const raw = fs.readFileSync(DB_PATH, "utf-8");
  return JSON.parse(raw);
}

function writeDb(db) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

export function getRealEntries(category) {
  const db = readDb();
  return db[category] || [];
}

export function getRealEntry(category, id) {
  const list = getRealEntries(category);
  return list.find((e) => e.id === id) || null;
}

export function addRealEntry(category, entry) {
  const db = readDb();
  const list = db[category] || (db[category] = []);
  const newEntry = { ...entry, id: String(Date.now()) };
  list.push(newEntry);
  writeDb(db);
  return newEntry;
}

export function updateRealEntry(category, id, updates) {
  const db = readDb();
  const list = db[category] || [];
  const index = list.findIndex((e) => e.id === id);
  if (index === -1) return null;
  list[index] = { ...list[index], ...updates, id };
  writeDb(db);
  return list[index];
}
