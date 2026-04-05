import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import {
  DEFAULT_ENABLED_PORTFOLIO_SECTIONS,
  DEFAULT_PORTFOLIO_SECTION_ORDER,
} from "@/lib/portfolio-config";
import { IPortfolioSettings, PortfolioSectionKey } from "@/types";

type PortfolioSettingsRecord = Record<string, unknown> & {
  _id?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
  enabledSections?: unknown;
  sectionOrder?: unknown;
};

async function getPortfolioSettingsCollection() {
  const connection = await connectDB();
  return connection.connection.db!.collection<PortfolioSettingsRecord>("portfolio_settings");
}

function dedupeSections(items: PortfolioSectionKey[]) {
  return Array.from(new Set(items));
}

export function normalizePortfolioSettings(
  input?: Partial<IPortfolioSettings> | null
): Pick<IPortfolioSettings, "enabledSections" | "sectionOrder"> {
  const rawEnabled = Array.isArray(input?.enabledSections)
    ? input.enabledSections.filter((item): item is PortfolioSectionKey =>
        DEFAULT_PORTFOLIO_SECTION_ORDER.includes(item as PortfolioSectionKey)
      )
    : DEFAULT_ENABLED_PORTFOLIO_SECTIONS;

  const rawOrder = Array.isArray(input?.sectionOrder)
    ? input.sectionOrder.filter((item): item is PortfolioSectionKey =>
        DEFAULT_PORTFOLIO_SECTION_ORDER.includes(item as PortfolioSectionKey)
      )
    : DEFAULT_PORTFOLIO_SECTION_ORDER;

  const sectionOrder = dedupeSections([
    ...rawOrder,
    ...DEFAULT_PORTFOLIO_SECTION_ORDER.filter((section) => !rawOrder.includes(section)),
  ]);

  const enabledSections = dedupeSections(
    rawEnabled.filter((section) => sectionOrder.includes(section))
  );

  return {
    enabledSections,
    sectionOrder,
  };
}

export async function getPortfolioSettingsLean() {
  const collection = await getPortfolioSettingsCollection();
  const existing = (await collection.findOne(
    {},
    { sort: { updatedAt: -1, createdAt: -1 } }
  )) as IPortfolioSettings | null;

  if (!existing) {
    return {
      enabledSections: DEFAULT_ENABLED_PORTFOLIO_SECTIONS,
      sectionOrder: DEFAULT_PORTFOLIO_SECTION_ORDER,
    };
  }

  return {
    ...existing,
    ...normalizePortfolioSettings(existing),
  };
}

export async function savePortfolioSettingsSingleton(data: {
  enabledSections: PortfolioSectionKey[];
  sectionOrder: PortfolioSectionKey[];
}) {
  const collection = await getPortfolioSettingsCollection();
  const now = new Date();
  const normalized = normalizePortfolioSettings(data);
  const existing = await collection.findOne({}, { sort: { updatedAt: -1, createdAt: -1 } });

  if (existing?._id) {
    await collection.updateOne(
      { _id: existing._id },
      {
        $set: {
          ...normalized,
          updatedAt: now,
        },
      }
    );

    const saved = (await collection.findOne({ _id: existing._id })) as IPortfolioSettings | null;
    return saved
      ? {
          ...saved,
          ...normalizePortfolioSettings(saved),
        }
      : null;
  }

  const result = await collection.insertOne({
    ...normalized,
    createdAt: now,
    updatedAt: now,
  });

  const saved = (await collection.findOne({ _id: result.insertedId })) as IPortfolioSettings | null;
  return saved
    ? {
        ...saved,
        ...normalizePortfolioSettings(saved),
      }
    : null;
}
