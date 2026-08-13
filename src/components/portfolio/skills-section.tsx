"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ISkill } from "@/types";
import { SectionHeading } from "@/components/portfolio/section-heading";
import { StaggerContainer, StaggerItem } from "@/components/shared/motion-wrapper";
import { CountUp } from "@/components/shared/count-up";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SkillsSectionProps {
  skills: ISkill[];
}

const categories = [
  { value: "frontend", label: "Frontend" },
  { value: "backend", label: "Backend" },
  { value: "database", label: "Database" },
  { value: "tools", label: "Tools" },
] as const;

export function SkillsSection({ skills }: SkillsSectionProps) {
  const reduceMotion = useReducedMotion();

  const grouped = skills.reduce(
    (acc, skill) => {
      const cat = skill.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(skill);
      return acc;
    },
    {} as Record<string, ISkill[]>
  );

  // Marquee strip of every skill name, duplicated so the loop is seamless.
  const marqueeItems = skills.map((skill) => skill.name);

  return (
    <section id="skills" className="relative py-24">
      <div className="max-w-6xl mx-auto px-4">
        <SectionHeading
          eyebrow="Stack"
          title="Skills & Technologies"
          subtitle="The tools I reach for when building production applications."
        />

        <Tabs defaultValue="frontend" className="w-full">
          <TabsList className="mx-auto mb-10 grid w-full max-w-md grid-cols-4 rounded-full border border-border/70 bg-card/60 p-1 backdrop-blur-md">
            {categories.map((cat) => (
              <TabsTrigger
                key={cat.value}
                value={cat.value}
                className="rounded-full text-xs sm:text-sm transition-all data-[state=active]:shadow-sm"
              >
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map((cat) => {
            const items = [...(grouped[cat.value] || [])].sort((a, b) => a.order - b.order);

            return (
              <TabsContent key={cat.value} value={cat.value} className="focus-visible:outline-none">
                {items.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground">
                    No skills listed in this category yet.
                  </p>
                ) : (
                  <StaggerContainer
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
                    stagger={0.07}
                  >
                    {items.map((skill) => (
                      <StaggerItem key={skill._id}>
                        <motion.div
                          whileHover={{ y: -5 }}
                          transition={{ type: "spring", stiffness: 320, damping: 22 }}
                          className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card p-5 shadow-sm transition-colors hover:border-primary/40 hover:shadow-[0_18px_40px_-22px_hsl(var(--primary)/0.6)]"
                        >
                          <div
                            aria-hidden
                            className="absolute inset-0 bg-gradient-to-br from-primary/8 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                          />

                          <div className="relative">
                            <div className="mb-3 flex items-center justify-between">
                              <h3 className="text-base font-semibold transition-colors group-hover:text-primary">
                                {skill.name}
                              </h3>
                              <span className="text-sm font-medium tabular-nums text-muted-foreground">
                                <CountUp value={`${skill.proficiency}`} duration={1200} />%
                              </span>
                            </div>

                            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                              <motion.div
                                className="relative h-full rounded-full bg-gradient-to-r from-primary/70 to-primary"
                                initial={{ width: 0 }}
                                whileInView={{ width: `${skill.proficiency}%` }}
                                viewport={{ once: true }}
                                transition={{
                                  duration: reduceMotion ? 0 : 1.1,
                                  ease: [0.22, 1, 0.36, 1],
                                  delay: 0.15,
                                }}
                              />
                            </div>
                          </div>
                        </motion.div>
                      </StaggerItem>
                    ))}
                  </StaggerContainer>
                )}
              </TabsContent>
            );
          })}
        </Tabs>

        {/* Continuous strip of everything in the stack */}
        {marqueeItems.length > 4 && (
          <div className="marquee-viewport mt-14 overflow-hidden">
            <div className="marquee-track gap-3">
              {[...marqueeItems, ...marqueeItems].map((name, index) => (
                <span
                  key={`${name}-${index}`}
                  className="shrink-0 rounded-full border border-border/60 bg-card/60 px-4 py-2 text-sm text-muted-foreground backdrop-blur-md"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
