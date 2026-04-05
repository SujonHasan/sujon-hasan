import type { CSSProperties } from "react";
import { Navbar } from "@/components/portfolio/navbar";
import { Footer } from "@/components/portfolio/footer";
import { connectDB } from "@/lib/db";
import { getLatestAboutLean } from "@/lib/about";
import { getPortfolioSettingsLean } from "@/lib/portfolio-settings";
import { PORTFOLIO_SECTIONS } from "@/lib/portfolio-config";
import { getThemeCssVariables, getThemeSettingsLean } from "@/lib/theme-settings";

export default async function PortfolioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let socialLinks;
  let navLinks: Array<{ label: string; href: string }> = [];
  let themePreset = "default";
  let backgroundStyle = "none";
  let showThemeToggle = true;
  let themeStyle: Record<string, string> = {};
  try {
    await connectDB();
    const [about, settings, themeSettings] = await Promise.all([
      getLatestAboutLean(),
      getPortfolioSettingsLean(),
      getThemeSettingsLean(),
    ]);
    socialLinks = about?.socialLinks;
    themePreset = themeSettings.themePreset;
    backgroundStyle = themeSettings.backgroundStyle;
    showThemeToggle = themeSettings.showThemeToggle;
    themeStyle = getThemeCssVariables(themeSettings);
    navLinks = settings.sectionOrder
      .filter((sectionId) => settings.enabledSections.includes(sectionId))
      .map((sectionId) => PORTFOLIO_SECTIONS.find((section) => section.id === sectionId))
      .filter((section): section is NonNullable<typeof section> => Boolean(section?.anchor))
      .map((section) => ({
        label: section.navLabel || section.label,
        href: `#${section.anchor}`,
      }));
  } catch {
    socialLinks = undefined;
    navLinks = PORTFOLIO_SECTIONS.filter((section) => section.anchor).map((section) => ({
      label: section.navLabel || section.label,
      href: `#${section.anchor}`,
    }));
  }

  return (
    <div
      data-portfolio-theme={themePreset}
      data-portfolio-background={backgroundStyle}
      style={themeStyle as CSSProperties}
    >
      <Navbar links={navLinks} showThemeToggle={showThemeToggle} />
      <main>{children}</main>
      <Footer socialLinks={socialLinks as Record<string, string> | undefined} />
    </div>
  );
}
