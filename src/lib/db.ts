import mongoose from "mongoose";

const MONGO_DB_URI = process.env.NEXT_MONGO_DB_URI || "";

if (!MONGO_DB_URI || MONGO_DB_URI.trim().length === 0) {
  throw new Error("NEXT_MONGO_DB_URI is not set in environment variables");
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

export async function dbConnect(): Promise<typeof mongoose> {
  if (cached?.conn) {
    return cached.conn;
  }

  if (!cached?.promise) {
    cached!.promise = mongoose
      .connect(MONGO_DB_URI, {
        dbName: process.env.NEXT_DB_NAME || "task_next",
      })
      .then((m) => m)
      .catch((err) => {
        throw new Error(`Failed to connect to MongoDB: ${String(err)}`);
      });
  }

  cached!.conn = await cached!.promise;
  return cached!.conn;
}

export { mongoose };
