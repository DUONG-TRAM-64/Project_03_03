import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DATA_DIR = path.join(process.cwd(), 'data');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getFilePath(collection: string): string {
  ensureDataDir();
  return path.join(DATA_DIR, `${collection}.json`);
}

function readCollection<T>(collection: string): T[] {
  const filePath = getFilePath(collection);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '[]', 'utf-8');
    return [];
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeCollection<T>(collection: string, data: T[]): void {
  const filePath = getFilePath(collection);
  ensureDataDir();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export function generateId(): string {
  return crypto.randomBytes(12).toString('hex');
}

export function findAll<T>(collection: string, filter?: Partial<T>): T[] {
  let items = readCollection<T>(collection);
  if (filter) {
    items = items.filter((item) => {
      return Object.entries(filter).every(([key, value]) => {
        return (item as any)[key] === value;
      });
    });
  }
  return items;
}

export function findById<T extends { _id: string }>(collection: string, id: string): T | null {
  const items = readCollection<T>(collection);
  return items.find((item) => item._id === id) || null;
}

export function findOne<T>(collection: string, filter: Partial<T>): T | null {
  const items = readCollection<T>(collection);
  return items.find((item) => {
    return Object.entries(filter).every(([key, value]) => {
      return (item as any)[key] === value;
    });
  }) || null;
}

export function insertOne<T extends { _id?: string }>(collection: string, doc: T): T & { _id: string } {
  const items = readCollection<T>(collection);
  const newDoc = { ...doc, _id: doc._id || generateId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as T & { _id: string };
  items.push(newDoc);
  writeCollection(collection, items);
  return newDoc;
}

export function updateOne<T extends { _id: string }>(collection: string, id: string, updates: Partial<T>): T | null {
  const items = readCollection<T>(collection);
  const index = items.findIndex((item: any) => item._id === id);
  if (index === -1) return null;
  items[index] = { ...items[index], ...updates, updatedAt: new Date().toISOString() } as T;
  writeCollection(collection, items);
  return items[index];
}

export function deleteOne<T extends { _id: string }>(collection: string, id: string): boolean {
  const items = readCollection<T>(collection);
  const filtered = items.filter((item: any) => item._id !== id);
  if (filtered.length === items.length) return false;
  writeCollection(collection, filtered);
  return true;
}

export function deleteMany<T>(collection: string, filter: Partial<T>): number {
  const items = readCollection<T>(collection);
  const remaining = items.filter((item) => {
    return !Object.entries(filter).every(([key, value]) => (item as any)[key] === value);
  });
  const deleted = items.length - remaining.length;
  writeCollection(collection, remaining);
  return deleted;
}

export function aggregate<T>(collection: string, userId: string, groupField?: string): Record<string, number> {
  const items = readCollection<T>(collection).filter((item: any) => item.userId === userId);
  const result: Record<string, number> = {};
  if (groupField) {
    items.forEach((item: any) => {
      const key = String(item[groupField]);
      result[key] = (result[key] || 0) + (item.duration || 0);
    });
  }
  return result;
}
