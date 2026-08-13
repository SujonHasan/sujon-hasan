"use client";

import { useState, FormEvent } from "react";
import { motion } from "framer-motion";
import { IContact } from "@/types";
import { SectionHeading } from "./section-heading";
import { MotionWrapper } from "@/components/shared/motion-wrapper";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, Phone, MapPin, Send } from "lucide-react";

interface ContactSectionProps {
  contact: IContact | null;
}

export function ContactSection({ contact }: ContactSectionProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

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
        toast({
          title: "Message sent!",
          description: "Thank you for reaching out. I'll get back to you soon.",
        });
        setFormData({ name: "", email: "", subject: "", message: "" });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to send message. Please try again.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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

          {/* Right: Contact form */}
          <MotionWrapper direction="right">
            <Card className="border-border/70 shadow-sm">
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
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
                </form>
              </CardContent>
            </Card>
          </MotionWrapper>
        </div>
      </div>
    </section>
  );
}
