import { Navbar } from "@/components/portfolio/navbar";
import { Footer } from "@/components/portfolio/footer";
import { connectDB } from "@/lib/db";
import { getLatestAboutLean } from "@/lib/about";
import { getPortfolioSettingsLean } from "@/lib/portfolio-settings";
import { PORTFOLIO_SECTIONS } from "@/lib/portfolio-config";
import { getThemeScopedCss, getThemeSettingsLean } from "@/lib/theme-settings";
import { IThemeSettings } from "@/types";

export default async function PortfolioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let socialLinks;
  let ownerName: string | undefined;
  let navLinks: Array<{ label: string; href: string }> = [];
  let themePreset = "default";
  let backgroundStyle = "none";
  let showThemeToggle = true;
  let themeSettings: Partial<IThemeSettings> | null = null;

  try {
    await connectDB();
    const [about, settings, theme] = await Promise.all([
      getLatestAboutLean(),
      getPortfolioSettingsLean(),
      getThemeSettingsLean(),
    ]);
    socialLinks = about?.socialLinks;
    ownerName = about?.name;
    themeSettings = theme;
    themePreset = theme.themePreset;
    backgroundStyle = theme.backgroundStyle;
    showThemeToggle = theme.showThemeToggle;
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
      id="top"
      data-portfolio-scope=""
      data-portfolio-theme={themePreset}
      data-portfolio-background={backgroundStyle}
      className="min-h-screen bg-background text-foreground"
    >
      {/* Scoped rules rather than an inline style attribute, so the `.dark`
          class can still override the palette. */}
      <style
        dangerouslySetInnerHTML={{ __html: getThemeScopedCss(themeSettings) }}
      />
      <Navbar links={navLinks} showThemeToggle={showThemeToggle} />
      <main>{children}</main>
      <Footer
        socialLinks={socialLinks as Record<string, string> | undefined}
        navLinks={navLinks}
        name={ownerName}
      />
    </div>
  );
}
