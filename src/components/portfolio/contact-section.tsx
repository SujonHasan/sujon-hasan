"use client";

import { useState, FormEvent } from "react";
import {
  AnimatePresence,
  motion,
  useAnimationControls,
  useReducedMotion,
} from "framer-motion";
import { IContact } from "@/types";
import { SectionHeading } from "./section-heading";
import { MotionWrapper } from "@/components/shared/motion-wrapper";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, Phone, MapPin, Send, MailCheck, RotateCcw } from "lucide-react";

interface ContactSectionProps {
  contact: IContact | null;
}

const EASE = [0.22, 1, 0.36, 1] as const;

/** Burst geometry, precomputed so the render stays deterministic. */
const PARTICLES = Array.from({ length: 18 }, (_, i) => {
  const angle = (i / 18) * Math.PI * 2;
  // Alternating radii keep the burst from reading as a perfect ring.
  const distance = i % 2 === 0 ? 108 : 78;
  return {
    id: i,
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance,
    size: i % 3 === 0 ? 7 : 4,
    delay: 0.52 + (i % 6) * 0.018,
  };
});

const RINGS = [0, 0.22, 0.44];

export function ContactSection({ contact }: ContactSectionProps) {
  const { toast } = useToast();
  const reduceMotion = useReducedMotion();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  /**
   * Drives the failure shake. Controls rather than a keyed remount, so a
   * rejected submit never tears down the form and loses the visitor's focus.
   */
  const shake = useAnimationControls();
  /** Snapshot of who just wrote in, so the success panel can name them. */
  const [sentTo, setSentTo] = useState({ name: "", email: "" });
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    website: "", // honeypot — hidden from humans, filled by bots
  });

  const failed = (description: string) => {
    if (!reduceMotion) {
      shake.start({
        x: [0, -9, 8, -6, 4, 0],
        transition: { duration: 0.45, ease: "easeInOut" },
      });
    }
    toast({ title: "Error", description, variant: "destructive" });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/contact/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSentTo({ name: formData.name.trim(), email: formData.email.trim() });
        setFormData({ name: "", email: "", subject: "", message: "", website: "" });
        setSent(true);
      } else {
        failed(data.error || "Failed to send message. Please try again.");
      }
    } catch {
      failed("Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const firstName = sentTo.name.split(" ")[0] || "there";

  const infoCards = [
    contact?.email && {
      key: "email",
      icon: Mail,
      label: "Email",
      value: contact.email,
      href: `mailto:${contact.email}`,
    },
    contact?.phone && {
      key: "phone",
      icon: Phone,
      label: "Phone",
      value: contact.phone,
      href: `tel:${contact.phone}`,
    },
    contact?.address && {
      key: "address",
      icon: MapPin,
      label: "Address",
      value: contact.address,
      href: undefined,
    },
  ].filter(Boolean) as Array<{
    key: string;
    icon: typeof Mail;
    label: string;
    value: string;
    href?: string;
  }>;

  return (
    <section id="contact" className="relative py-24">
      <div className="max-w-6xl mx-auto px-4">
        <SectionHeading
          eyebrow="Contact"
          title="Get In Touch"
          subtitle="Have a project in mind? Send a message and I'll reply within 24 hours."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left: Contact info */}
          <MotionWrapper direction="left">
            <div className="space-y-4">
              {infoCards.map(({ key, icon: Icon, label, value, href }) => (
                <motion.div
                  key={key}
                  whileHover={{ x: 6 }}
                  transition={{ type: "spring", stiffness: 340, damping: 24 }}
                >
                  <Card className="group border-border/70 transition-colors hover:border-primary/40">
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="rounded-xl bg-primary/10 p-2.5 text-primary transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-muted-foreground">{label}</p>
                        {href ? (
                          <a
                            href={href}
                            className="block truncate font-medium transition-colors hover:text-primary"
                          >
                            {value}
                          </a>
                        ) : (
                          <p className="font-medium">{value}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}

              {contact?.availability && (
                <Card className="border-emerald-500/30 bg-emerald-500/5">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2.5">
                      <span className="relative flex h-3 w-3">
                        <span className="pulse-ring absolute inline-flex h-full w-full rounded-full bg-emerald-400" />
                        <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
                      </span>
                      <span className="font-medium">{contact.availability}</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </MotionWrapper>

          {/* Right: Contact form → success panel */}
          <MotionWrapper direction="right">
            <motion.div animate={shake}>
              {/*
                `layout` lets the card glide between the form's height and the
                shorter success panel instead of snapping, which is what makes
                the swap read as one continuous motion.
              */}
              <motion.div layout transition={{ duration: 0.5, ease: EASE }}>
                <Card
                  className={`relative overflow-hidden border-border/70 shadow-sm transition-shadow duration-500 ${
                    sent ? "glow-ring border-primary/40" : ""
                  }`}
                >
                  {/* One-shot light sweep across the card the moment it flips. */}
                  <AnimatePresence>
                    {sent && !reduceMotion && (
                      <motion.div
                        key="sweep"
                        className="pointer-events-none absolute inset-y-0 z-10 w-1/2 bg-gradient-to-r from-transparent via-primary/15 to-transparent"
                        initial={{ x: "-140%" }}
                        animate={{ x: "260%" }}
                        transition={{ duration: 1.1, delay: 0.25, ease: EASE }}
                      />
                    )}
                  </AnimatePresence>

                  <CardContent className="p-6">
                    <AnimatePresence mode="wait" initial={false}>
                      {sent ? (
                        <motion.div
                          key="success"
                          className="relative flex flex-col items-center py-8 text-center"
                          initial={
                            reduceMotion
                              ? { opacity: 0 }
                              : { opacity: 0, scale: 0.92, y: 14 }
                          }
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={
                            reduceMotion
                              ? { opacity: 0 }
                              : { opacity: 0, scale: 0.96, y: -10 }
                          }
                          transition={{
                            type: "spring",
                            stiffness: 220,
                            damping: 22,
                          }}
                        >
                          {/* Checkmark stage */}
                          <div className="relative mb-6 grid h-28 w-28 place-items-center">
                            {/* Expanding rings, echoing the availability pulse. */}
                            {!reduceMotion &&
                              RINGS.map((delay) => (
                                <motion.span
                                  key={delay}
                                  className="absolute h-20 w-20 rounded-full border border-primary/50"
                                  initial={{ scale: 0.5, opacity: 0.6 }}
                                  animate={{ scale: 2.3, opacity: 0 }}
                                  transition={{
                                    duration: 1.5,
                                    delay: 0.35 + delay,
                                    ease: "easeOut",
                                  }}
                                />
                              ))}

                            {/* Radial burst. */}
                            {!reduceMotion &&
                              PARTICLES.map((p) => (
                                <motion.span
                                  key={p.id}
                                  className="absolute rounded-full bg-primary"
                                  style={{ width: p.size, height: p.size }}
                                  initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                                  animate={{
                                    x: p.x,
                                    y: p.y,
                                    scale: [0, 1, 0.2],
                                    opacity: [0, 1, 0],
                                  }}
                                  transition={{
                                    duration: 1.15,
                                    delay: p.delay,
                                    ease: [0.16, 0.8, 0.3, 1],
                                  }}
                                />
                              ))}

                            {/* Soft halo behind the mark. */}
                            <motion.span
                              className="absolute h-20 w-20 rounded-full bg-primary/10 blur-md"
                              initial={{ scale: 0.4, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ duration: 0.6, ease: EASE }}
                            />

                            <motion.svg
                              viewBox="0 0 52 52"
                              className="relative h-20 w-20"
                              initial={{ scale: 0.7 }}
                              animate={{ scale: 1 }}
                              transition={{
                                type: "spring",
                                stiffness: 260,
                                damping: 16,
                              }}
                            >
                              <motion.circle
                                cx="26"
                                cy="26"
                                r="23"
                                fill="none"
                                stroke="hsl(var(--primary))"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                style={{ rotate: -90, transformOrigin: "50% 50%" }}
                                initial={
                                  reduceMotion
                                    ? { pathLength: 1 }
                                    : { pathLength: 0 }
                                }
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.65, ease: EASE }}
                              />
                              <motion.path
                                d="M15.5 26.5 L22.5 33.5 L36.5 18.5"
                                fill="none"
                                stroke="hsl(var(--primary))"
                                strokeWidth="3.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                initial={
                                  reduceMotion
                                    ? { pathLength: 1 }
                                    : { pathLength: 0 }
                                }
                                animate={{ pathLength: 1 }}
                                transition={{
                                  duration: 0.35,
                                  delay: reduceMotion ? 0 : 0.48,
                                  ease: "easeOut",
                                }}
                              />
                            </motion.svg>
                          </div>

                          {/* Copy, revealed just behind the checkmark. */}
                          <motion.h3
                            className="text-gradient text-2xl font-bold sm:text-3xl"
                            initial={reduceMotion ? {} : { opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.6, ease: EASE }}
                          >
                            Message sent
                          </motion.h3>

                          <motion.p
                            className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground"
                            initial={reduceMotion ? {} : { opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.72, ease: EASE }}
                          >
                            Thanks, {firstName} — it&rsquo;s in my inbox. I&rsquo;ll reply to{" "}
                            <span className="font-medium text-foreground">
                              {sentTo.email}
                            </span>{" "}
                            within 24 hours.
                          </motion.p>

                          <motion.div
                            className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/5 px-3.5 py-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400"
                            initial={reduceMotion ? {} : { opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4, delay: 0.84, ease: EASE }}
                          >
                            <span className="relative flex h-2 w-2">
                              <span className="pulse-ring absolute inline-flex h-full w-full rounded-full bg-emerald-400" />
                              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                            </span>
                            <MailCheck className="h-3.5 w-3.5" />
                            Delivered
                          </motion.div>

                          <motion.div
                            initial={reduceMotion ? {} : { opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.45, delay: 0.96, ease: EASE }}
                          >
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => setSent(false)}
                              className="group mt-6 rounded-full text-muted-foreground hover:text-primary"
                            >
                              <RotateCcw className="mr-2 h-4 w-4 transition-transform duration-500 group-hover:-rotate-180" />
                              Send another message
                            </Button>
                          </motion.div>
                        </motion.div>
                      ) : (
                        <motion.form
                          key="form"
                          onSubmit={handleSubmit}
                          className="space-y-4"
                          initial={
                            reduceMotion
                              ? { opacity: 0 }
                              : { opacity: 0, y: 12, filter: "blur(4px)" }
                          }
                          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                          exit={
                            reduceMotion
                              ? { opacity: 0 }
                              : { opacity: 0, scale: 0.97, filter: "blur(6px)" }
                          }
                          transition={{ duration: 0.35, ease: EASE }}
                        >
                          <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                              id="name"
                              placeholder="Your name"
                              value={formData.name}
                              onChange={(e) =>
                                setFormData({ ...formData, name: e.target.value })
                              }
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                              id="email"
                              type="email"
                              placeholder="your@email.com"
                              value={formData.email}
                              onChange={(e) =>
                                setFormData({ ...formData, email: e.target.value })
                              }
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="subject">Subject</Label>
                            <Input
                              id="subject"
                              placeholder="What's this about?"
                              value={formData.subject}
                              onChange={(e) =>
                                setFormData({ ...formData, subject: e.target.value })
                              }
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="message">Message</Label>
                            <Textarea
                              id="message"
                              placeholder="Your message..."
                              rows={5}
                              value={formData.message}
                              onChange={(e) =>
                                setFormData({ ...formData, message: e.target.value })
                              }
                              required
                            />
                          </div>

                          {/*
                            Honeypot. Hidden from sighted users and from screen
                            readers, but bots that fill every input will trip it.
                          */}
                          <div
                            aria-hidden="true"
                            className="pointer-events-none absolute -left-[9999px] h-0 w-0 overflow-hidden opacity-0"
                          >
                            <label htmlFor="website">Leave this field empty</label>
                            <input
                              id="website"
                              name="website"
                              type="text"
                              tabIndex={-1}
                              autoComplete="off"
                              value={formData.website}
                              onChange={(e) =>
                                setFormData({ ...formData, website: e.target.value })
                              }
                            />
                          </div>

                          <Button
                            type="submit"
                            className="group w-full rounded-full py-6 text-base transition-shadow hover:shadow-[0_18px_45px_-14px_hsl(var(--primary)/0.7)]"
                            disabled={loading}
                          >
                            {loading ? (
                              <>
                                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                Sending...
                              </>
                            ) : (
                              <>
                                <Send className="mr-2 h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-0.5" />
                                Send Message
                              </>
                            )}
                          </Button>
                        </motion.form>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </MotionWrapper>
        </div>
      </div>
    </section>
  );
}
