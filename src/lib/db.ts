import mongoose from "mongoose";

/**
 * Read lazily rather than at module scope. `next build` imports every route
 * module to collect page data, so throwing here would fail the whole build on
 * any machine without the variable set — instead of failing the one request
 * that actually needs a database.
 */
function getMongoUri(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Please define the MONGODB_URI environment variable");
  }
  return uri;
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? { conn: null, promise: null };
if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(getMongoUri(), {
      bufferCommands: false,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}
