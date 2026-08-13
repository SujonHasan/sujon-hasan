import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { PORTFOLIO_THEME_PRESETS } from "@/lib/portfolio-config";
import {
  IThemeSettings,
  PortfolioThemePreset,
  ThemeBackgroundStyle,
  ThemeRadiusScale,
} from "@/types";

type ThemeSettingsRecord = Record<string, unknown> & {
  _id?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
};

type ThemeSettingsShape = Pick<
  IThemeSettings,
  | "themePreset"
  | "primaryColor"
  | "accentColor"
  | "backgroundColor"
  | "surfaceColor"
  | "textColor"
  | "mutedColor"
  | "backgroundStyle"
  | "radiusScale"
  | "showThemeToggle"
>;

const HEX_COLOR_REGEX = /^#([0-9a-f]{6})$/i;

async function getThemeSettingsCollection() {
  const connection = await connectDB();
  return connection.connection.db!.collection<ThemeSettingsRecord>("theme_settings");
}

function getThemePresetConfig(themePreset?: string | null) {
  return (
    PORTFOLIO_THEME_PRESETS.find((theme) => theme.id === themePreset) ||
    PORTFOLIO_THEME_PRESETS[0]
  );
}

function normalizeHexColor(value: unknown, fallback: string) {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value.trim();
  return HEX_COLOR_REGEX.test(normalized) ? normalized.toLowerCase() : fallback;
}

export function normalizeThemeSettings(input?: Partial<IThemeSettings> | null): ThemeSettingsShape {
  const preset = getThemePresetConfig(input?.themePreset);
  const backgroundStyle: ThemeBackgroundStyle =
    input?.backgroundStyle === "glow" ||
    input?.backgroundStyle === "grid" ||
    input?.backgroundStyle === "dots"
      ? input.backgroundStyle
      : "none";

  const radiusScale: ThemeRadiusScale =
    input?.radiusScale === "soft" ||
    input?.radiusScale === "sharp"
      ? input.radiusScale
      : "rounded";

  return {
    themePreset: preset.id as PortfolioThemePreset,
    primaryColor: normalizeHexColor(input?.primaryColor, preset.primaryColor),
    accentColor: normalizeHexColor(input?.accentColor, preset.accentColor),
    backgroundColor: normalizeHexColor(input?.backgroundColor, preset.backgroundColor),
    surfaceColor: normalizeHexColor(input?.surfaceColor, preset.surfaceColor),
    textColor: normalizeHexColor(input?.textColor, preset.textColor),
    mutedColor: normalizeHexColor(input?.mutedColor, preset.mutedColor),
    backgroundStyle,
    radiusScale,
    showThemeToggle: typeof input?.showThemeToggle === "boolean" ? input.showThemeToggle : true,
  };
}

export async function getThemeSettingsLean() {
  const collection = await getThemeSettingsCollection();
  const existing = (await collection.findOne(
    {},
    { sort: { updatedAt: -1, createdAt: -1 } }
  )) as IThemeSettings | null;

  if (!existing) {
    return normalizeThemeSettings();
  }

  return {
    ...existing,
    ...normalizeThemeSettings(existing),
  };
}

export async function saveThemeSettingsSingleton(data: ThemeSettingsShape) {
  const collection = await getThemeSettingsCollection();
  const now = new Date();
  const normalized = normalizeThemeSettings(data);
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

    const saved = (await collection.findOne({ _id: existing._id })) as IThemeSettings | null;
    return saved
      ? {
          ...saved,
          ...normalizeThemeSettings(saved),
        }
      : null;
  }

  const result = await collection.insertOne({
    ...normalized,
    createdAt: now,
    updatedAt: now,
  });

  const saved = (await collection.findOne({ _id: result.insertedId })) as IThemeSettings | null;
  return saved
    ? {
        ...saved,
        ...normalizeThemeSettings(saved),
      }
    : null;
}

function hexToHsl(hex: string) {
  const value = hex.replace("#", "");
  const r = Number.parseInt(value.slice(0, 2), 16) / 255;
  const g = Number.parseInt(value.slice(2, 4), 16) / 255;
  const b = Number.parseInt(value.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
        break;
    }

    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function hsl(h: number, s: number, l: number) {
  return `${h} ${clamp(s, 0, 100)}% ${clamp(l, 0, 100)}%`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function hexToHslString(hex: string) {
  const { h, s, l } = hexToHsl(hex);
  return hsl(h, s, l);
}

function getRadius(radiusScale: ThemeRadiusScale) {
  return radiusScale === "soft" ? "1rem" : radiusScale === "sharp" ? "0.2rem" : "0.65rem";
}

/**
 * Light-mode palette derived directly from the admin colour pickers.
 */
export function getThemeCssVariables(input?: Partial<IThemeSettings> | null) {
  const theme = normalizeThemeSettings(input);

  return {
    "--background": hexToHslString(theme.backgroundColor),
    "--foreground": hexToHslString(theme.textColor),
    "--card": hexToHslString(theme.surfaceColor),
    "--card-foreground": hexToHslString(theme.textColor),
    "--popover": hexToHslString(theme.surfaceColor),
    "--popover-foreground": hexToHslString(theme.textColor),
    "--primary": hexToHslString(theme.primaryColor),
    "--primary-foreground": hexToHslString("#ffffff"),
    "--secondary": hexToHslString(theme.accentColor),
    "--secondary-foreground": hexToHslString(theme.textColor),
    "--muted": hexToHslString(theme.accentColor),
    "--muted-foreground": hexToHslString(theme.mutedColor),
    "--accent": hexToHslString(theme.accentColor),
    "--accent-foreground": hexToHslString(theme.textColor),
    "--border": hexToHslString(theme.accentColor),
    "--input": hexToHslString(theme.accentColor),
    "--ring": hexToHslString(theme.primaryColor),
    "--radius": getRadius(theme.radiusScale),
  } as Record<string, string>;
}

/**
 * Dark counterpart of the same palette. The admin only picks light colours, so
 * the dark surfaces are derived from those hues: lightness is inverted while
 * hue and (a damped) saturation are preserved, which keeps the brand identity
 * recognisable without washing the page out.
 */
export function getThemeDarkCssVariables(input?: Partial<IThemeSettings> | null) {
  const theme = normalizeThemeSettings(input);

  const primary = hexToHsl(theme.primaryColor);
  const background = hexToHsl(theme.backgroundColor);

  // Brand colour needs to stay readable against a near-black background.
  const darkPrimary = hsl(primary.h, clamp(primary.s, 45, 92), clamp(primary.l + 12, 52, 68));

  // Light backgrounds are usually white or near-white, so their own hue is
  // meaningless (white reads as hue 0 and would tint every dark surface red).
  // Take the hue from the brand colour instead and keep saturation low so the
  // surfaces stay neutral rather than coloured.
  const surfaceHue = background.s < 8 ? primary.h : background.h;
  const surfaceSat = clamp(primary.s * 0.22, 6, 22);
  const textSat = clamp(surfaceSat * 0.7, 0, 16);

  return {
    "--background": hsl(surfaceHue, surfaceSat, 5),
    "--foreground": hsl(surfaceHue, textSat, 97),
    "--card": hsl(surfaceHue, surfaceSat, 9),
    "--card-foreground": hsl(surfaceHue, textSat, 97),
    "--popover": hsl(surfaceHue, surfaceSat, 9),
    "--popover-foreground": hsl(surfaceHue, textSat, 97),
    "--primary": darkPrimary,
    "--primary-foreground": hsl(surfaceHue, textSat, 8),
    "--secondary": hsl(surfaceHue, surfaceSat, 16),
    "--secondary-foreground": hsl(surfaceHue, textSat, 97),
    "--muted": hsl(surfaceHue, surfaceSat, 16),
    "--muted-foreground": hsl(surfaceHue, clamp(textSat + 6, 0, 24), 66),
    "--accent": hsl(surfaceHue, surfaceSat, 16),
    "--accent-foreground": hsl(surfaceHue, textSat, 97),
    "--border": hsl(surfaceHue, surfaceSat, 18),
    "--input": hsl(surfaceHue, surfaceSat, 18),
    "--ring": darkPrimary,
    "--radius": getRadius(theme.radiusScale),
  } as Record<string, string>;
}

/**
 * Renders both palettes as a scoped stylesheet.
 *
 * These used to be applied as an inline `style` attribute, which beat the
 * `.dark` class rules in `globals.css` and left dark mode showing light
 * surfaces. Emitting real rules lets `.dark` win as intended.
 */
export function getThemeScopedCss(
  input: Partial<IThemeSettings> | null | undefined,
  scopeSelector = "[data-portfolio-scope]"
) {
  const toBlock = (vars: Record<string, string>) =>
    Object.entries(vars)
      .map(([key, value]) => `${key}:${value};`)
      .join("");

  return [
    `${scopeSelector}{${toBlock(getThemeCssVariables(input))}}`,
    `.dark ${scopeSelector}{${toBlock(getThemeDarkCssVariables(input))}}`,
  ].join("");
}
