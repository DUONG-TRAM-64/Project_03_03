import { MongoClient, Db } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI!;
const DB_NAME = process.env.MONGODB_DB || 'levelup';

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable in .env.local'
  );
}

// Global cache to prevent multiple connections in dev (HMR)
const globalForMongo = globalThis as unknown as {
  _mongoClientPromise: Promise<MongoClient> | undefined;
};

let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  if (!globalForMongo._mongoClientPromise) {
    const client = new MongoClient(MONGODB_URI);
    globalForMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalForMongo._mongoClientPromise;
} else {
  const client = new MongoClient(MONGODB_URI);
  clientPromise = client.connect();
}

export async function connectDB(): Promise<Db> {
  const client = await clientPromise;
  return client.db(DB_NAME);
}

export default clientPromise;
