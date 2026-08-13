"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { ScrollProgress } from "@/components/shared/scroll-progress";
import { cn } from "@/lib/utils";

interface NavbarLink {
  label: string;
  href: string;
}

interface NavbarProps {
  links: NavbarLink[];
  showThemeToggle?: boolean;
}

export function Navbar({ links, showThemeToggle = true }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const sectionIds = links.map((link) => link.href.replace("#", ""));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-50% 0px -50% 0px" }
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [links]);

  return (
    <>
      <ScrollProgress />

      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "sticky top-0 z-50 w-full border-b border-transparent transition-all duration-300",
          scrolled
            ? "border-border/70 bg-background/75 shadow-sm backdrop-blur-xl"
            : "bg-background/40 backdrop-blur-md"
        )}
      >
        <nav className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <Link
            href="/"
            className="group flex items-center gap-2 text-xl font-bold tracking-tight"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm text-primary-foreground shadow-sm transition-transform group-hover:scale-110 group-hover:rotate-6">
              SH
            </span>
            <span className="transition-opacity group-hover:opacity-80">Sujon Hasan</span>
          </Link>

          {/* Desktop nav */}
          <ul className="hidden items-center gap-1 md:flex">
            {links.map((link) => {
              const isActive = activeSection === link.href.replace("#", "");
              return (
                <li key={link.href} className="relative">
                  <a
                    href={link.href}
                    className={cn(
                      "relative z-10 block rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {link.label}
                  </a>
                  {/* Pill slides between items instead of snapping. */}
                  {isActive && (
                    <motion.span
                      layoutId="nav-active-pill"
                      aria-hidden
                      className="absolute inset-0 rounded-full bg-primary/10 ring-1 ring-primary/20"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                </li>
              );
            })}
          </ul>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {showThemeToggle ? <ThemeToggle /> : null}

            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <div className="mt-8 flex flex-col gap-1">
                  {links.map((link, index) => (
                    <motion.a
                      key={link.href}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      className={cn(
                        "rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-primary",
                        activeSection === link.href.replace("#", "")
                          ? "bg-accent text-primary"
                          : "text-muted-foreground"
                      )}
                    >
                      {link.label}
                    </motion.a>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </motion.header>
    </>
  );
}
