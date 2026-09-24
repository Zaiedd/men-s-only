// ============================================================
//  MEN'S ONLY · site-wide constants & taxonomy
// ============================================================

export const SITE_NAME = "MEN'S ONLY";
export const TAGLINE =
  "We don't want to build a good man. We want to build the PERFECT MAN.";
export const CTA_PRIMARY = "BECOME THE PERFECT MAN";
export const BRAND_RED = "#b2202c";
export const BRAND_GOLD = "#d8b36a";

export const NAV = {
  explore: "Explore",
  challenges: "Challenges",
  search: "Search",
  profile: "Profile",
};

export const CONTENT_TYPE_LABELS: Record<string, string> = {
  GUIDE: "Guide",
  TIP: "Tip",
  ROUTINE: "Routine",
  CHALLENGE: "Challenge",
  CHECKLIST: "Checklist",
  QUIZ: "Quiz",
  KNOWLEDGE: "Knowledge",
};

export const DIFFICULTY_LABELS: Record<string, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

export const SUBCATEGORY_LABELS: Record<string, string> = {
  fitness: "Fitness",
  nutrition: "Nutrition",
  sleep: "Sleep",
  recovery: "Recovery",
  style: "Style",
  hair: "Hair",
  skin: "Skin",
  grooming: "Grooming",
  fragrance: "Fragrance",
  discipline: "Discipline",
  confidence: "Confidence",
  focus: "Focus",
  mindset: "Mindset",
  career: "Career",
  money: "Money",
  communication: "Communication",
  relationships: "Relationships",
  social: "Social Skills",
  skills: "Practical Skills",
  psychology: "Psychology",
  etiquette: "Etiquette",
  general: "General Knowledge",
};

export type Subcategory = { key: string; label: string };

export type CategoryDef = {
  key: string;
  label: string;
  tagline: string;
  order: number;
  subcategories: Subcategory[];
  accent: string;
};

// Extensible taxonomy — new categories/subcategories are added here,
// the database is seeded, and new content flows through without UI changes.
export const CATEGORIES: CategoryDef[] = [
  {
    key: "BODY",
    label: "Body",
    tagline: "Build the machine you live in",
    order: 1,
    accent: "#c8ccd0",
    subcategories: [
      { key: "fitness", label: "Fitness" },
      { key: "nutrition", label: "Nutrition" },
      { key: "sleep", label: "Sleep" },
      { key: "recovery", label: "Recovery" },
    ],
  },
  {
    key: "LOOK",
    label: "Look",
    tagline: "Own the room before you speak",
    order: 2,
    accent: "#b2202c",
    subcategories: [
      { key: "style", label: "Style" },
      { key: "hair", label: "Hair" },
      { key: "skin", label: "Skin" },
      { key: "grooming", label: "Grooming" },
      { key: "fragrance", label: "Fragrance" },
    ],
  },
  {
    key: "MIND",
    label: "Mind",
    tagline: "Train the man inside",
    order: 3,
    accent: "#d8b36a",
    subcategories: [
      { key: "discipline", label: "Discipline" },
      { key: "confidence", label: "Confidence" },
      { key: "focus", label: "Focus" },
      { key: "mindset", label: "Mindset" },
    ],
  },
  {
    key: "LIFE",
    label: "Life",
    tagline: "Win in the real world",
    order: 4,
    accent: "#8f9aa5",
    subcategories: [
      { key: "career", label: "Career" },
      { key: "money", label: "Money" },
      { key: "communication", label: "Communication" },
      { key: "relationships", label: "Relationships" },
      { key: "social", label: "Social Skills" },
    ],
  },
  {
    key: "KNOWLEDGE",
    label: "Knowledge",
    tagline: "Know more. Stand taller.",
    order: 5,
    accent: "#a9925f",
    subcategories: [
      { key: "skills", label: "Practical Skills" },
      { key: "psychology", label: "Psychology" },
      { key: "etiquette", label: "Etiquette" },
      { key: "general", label: "General Knowledge" },
    ],
  },
];

export function categoryByKey(key: string): CategoryDef | undefined {
  return CATEGORIES.find((c) => c.key === key);
}

export function subcategoryLabel(key: string): string {
  return SUBCATEGORY_LABELS[key] ?? key;
}

export function subcategoriesFor(categoryKey: string): Subcategory[] {
  return categoryByKey(categoryKey)?.subcategories ?? [];
}