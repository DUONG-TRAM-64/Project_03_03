import crypto from 'crypto';
import { connectDB } from './db';

export function generateId(): string {
  return crypto.randomBytes(12).toString('hex');
}

export async function findAll<T>(collection: string, filter?: Partial<T>): Promise<T[]> {
  const db = await connectDB();
  const query = filter ? (filter as Record<string, unknown>) : {};
  const items = await db.collection(collection).find(query).toArray();
  return items as unknown as T[];
}

export async function findById<T extends { _id: string }>(collection: string, id: string): Promise<T | null> {
  const db = await connectDB();
  const item = await db.collection(collection).findOne({ _id: id as any });
  return item as unknown as T | null;
}

export async function findOne<T>(collection: string, filter: Partial<T>): Promise<T | null> {
  const db = await connectDB();
  const item = await db.collection(collection).findOne(filter as Record<string, unknown>);
  return item as unknown as T | null;
}

export async function insertOne<T extends { _id?: string }>(collection: string, doc: T): Promise<T & { _id: string }> {
  const db = await connectDB();
  const newDoc = {
    ...doc,
    _id: (doc._id || generateId()) as any,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await db.collection(collection).insertOne(newDoc);
  return newDoc as unknown as T & { _id: string };
}

export async function updateOne<T extends { _id: string }>(collection: string, id: string, updates: Partial<T>): Promise<T | null> {
  const db = await connectDB();
  const result = await db.collection(collection).findOneAndUpdate(
    { _id: id as any },
    { $set: { ...updates, updatedAt: new Date().toISOString() } },
    { returnDocument: 'after' }
  );
  return result as unknown as T | null;
}

export async function deleteOne<T extends { _id: string }>(collection: string, id: string): Promise<boolean> {
  const db = await connectDB();
  const result = await db.collection(collection).deleteOne({ _id: id as any });
  return result.deletedCount > 0;
}

export async function deleteMany<T>(collection: string, filter: Partial<T>): Promise<number> {
  const db = await connectDB();
  const result = await db.collection(collection).deleteMany(filter as Record<string, unknown>);
  return result.deletedCount;
}
