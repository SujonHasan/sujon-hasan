/**
 * Groups a project's free-text technology list into readable buckets for the
 * case-study page. Matching is by keyword, so "Next.js 16" and "Next.js" land
 * in the same group; anything unrecognised falls through to "Tools & Libraries".
 */
const TECH_GROUPS: Array<{ label: string; keywords: string[] }> = [
  {
    label: "Frontend",
    keywords: [
      "next", "react", "vue", "nuxt", "angular", "svelte", "typescript", "javascript",
      "tailwind", "shadcn", "framer", "html", "css", "sass", "flutter", "dart", "redux",
      "zustand", "swr", "tiptap", "recharts", "screenutil",
    ],
  },
  {
    label: "Backend & API",
    keywords: ["node", "express", "nest", "rest", "graphql", "api", "php", "laravel", "python", "django"],
  },
  {
    label: "Database & Storage",
    keywords: [
      "mongo", "mongoose", "postgres", "mysql", "sqlite", "redis", "firestore", "prisma",
      "cloudinary", "s3", "localstorage", "storage",
    ],
  },
  {
    label: "Auth & Security",
    keywords: ["jwt", "auth", "security", "bcrypt", "oauth", "helmet"],
  },
  {
    label: "Hosting & DevOps",
    keywords: [
      "vercel", "netlify", "hosting", "cpanel", "docker", "cloudflare", "static export",
      "nginx", "aws", "litespeed", "cdn",
    ],
  },
];

const FALLBACK_GROUP = "Tools & Libraries";

function startsWord(text: string, keyword: string) {
  let index = text.indexOf(keyword);
  while (index !== -1) {
    if (index === 0 || !/[a-z0-9]/.test(text[index - 1])) return true;
    index = text.indexOf(keyword, index + 1);
  }
  return false;
}

export function groupTechnologies(technologies: string[]) {
  const groups = new Map<string, string[]>();

  for (const tech of technologies) {
    const name = tech.toLowerCase();
    // Keywords must start a word, so "rest" matches "REST API" but not "Firestore".
    const match = TECH_GROUPS.find((group) =>
      group.keywords.some((keyword) => startsWord(name, keyword))
    );
    const label = match?.label ?? FALLBACK_GROUP;
    groups.set(label, [...(groups.get(label) ?? []), tech]);
  }

  // Keep a stable, predictable order regardless of the input order.
  const order = [...TECH_GROUPS.map((group) => group.label), FALLBACK_GROUP];
  return order
    .filter((label) => groups.has(label))
    .map((label) => ({ label, items: groups.get(label)! }));
}
