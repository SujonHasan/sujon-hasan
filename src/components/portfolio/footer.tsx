import Link from "next/link";
import { ArrowUp, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GithubIcon, LinkedinIcon, FacebookIcon, TwitterIcon } from "@/components/shared/icons";
import { sanitizeUrl } from "@/lib/sanitize";
import { Signature } from "@/components/shared/logo";

interface FooterProps {
  socialLinks?: {
    github?: string;
    linkedin?: string;
    facebook?: string;
    twitter?: string;
    website?: string;
  };
  navLinks?: Array<{ label: string; href: string }>;
  name?: string;
}

const socialIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  github: GithubIcon,
  linkedin: LinkedinIcon,
  facebook: FacebookIcon,
  twitter: TwitterIcon,
  website: Globe,
};

const socialLabels: Record<string, string> = {
  github: "GitHub",
  linkedin: "LinkedIn",
  facebook: "Facebook",
  twitter: "Twitter",
  website: "Website",
};

export function Footer({ socialLinks, navLinks = [], name }: FooterProps) {
  const links = socialLinks
    ? Object.entries(socialLinks).filter(([, url]) => sanitizeUrl(url))
    : [];
  const displayName = name || "Md. Sujon Hasan";
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-border/70">
      {/* Soft glow anchoring the bottom of the page */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-24 h-48 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.12),transparent_70%)]"
      />

      <div className="container relative mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          {/* Brand */}
          <div>
            <Link
              href="/"
              aria-label={`${displayName} — home`}
              className="inline-flex text-foreground transition-colors hover:text-primary"
            >
              <Signature className="h-14" />
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Full Stack Developer building fast, scalable web applications for
              businesses around the world.
            </p>
          </div>

          {/* Quick links */}
          {navLinks.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide">
                Quick Links
              </h3>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Social */}
          <div className="md:text-right">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide">
              Let&apos;s Connect
            </h3>
            <div className="flex items-center gap-2 md:justify-end">
              {links.map(([key, url]) => {
                const Icon = socialIcons[key as keyof typeof socialIcons];
                const safeUrl = sanitizeUrl(url);
                if (!Icon || !safeUrl) return null;
                return (
                  <Button
                    key={key}
                    variant="outline"
                    size="icon"
                    asChild
                    className="rounded-full transition-transform hover:-translate-y-1 hover:border-primary hover:text-primary"
                  >
                    <a
                      href={safeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={socialLabels[key] || key}
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border/70 pt-6 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {year} {displayName}. All rights reserved.
          </p>

          <div className="flex items-center gap-4">
            <p className="text-xs text-muted-foreground">
              Built with Next.js &amp; Tailwind CSS
            </p>
            <Button
              variant="outline"
              size="icon"
              asChild
              className="rounded-full transition-transform hover:-translate-y-1 hover:border-primary hover:text-primary"
            >
              <a href="#top" aria-label="Back to top">
                <ArrowUp className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
}
