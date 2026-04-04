import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { IAbout } from "@/types";

type AboutRecord = Record<string, unknown> & {
  _id?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
};

async function getAboutCollection() {
  const connection = await connectDB();
  return connection.connection.db!.collection<AboutRecord>("abouts");
}

export async function getLatestAboutLean() {
  const collection = await getAboutCollection();
  return collection.findOne({}, { sort: { updatedAt: -1, createdAt: -1 } }) as Promise<IAbout | null>;
}

export async function getLatestAboutQuery() {
  return getLatestAboutLean();
}

export async function saveAboutSingleton(data: Record<string, unknown>) {
  const collection = await getAboutCollection();
  const now = new Date();
  const existing = await collection.findOne({}, { sort: { updatedAt: -1, createdAt: -1 } });

  if (existing?._id) {
    await collection.updateOne(
      { _id: existing._id },
      {
        $set: {
          ...data,
          updatedAt: now,
        },
      }
    );

    return collection.findOne({ _id: existing._id });
  }

  const result = await collection.insertOne({
    ...data,
    createdAt: now,
    updatedAt: now,
  });

  return collection.findOne({ _id: result.insertedId });
}
