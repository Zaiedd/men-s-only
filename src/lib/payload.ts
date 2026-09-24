// ============================================================
//  MEN'S ONLY · content payload model
//  Each ContentType has a canonical JSON payload + safe parser.
//  Seed + admin forms produce these shapes; renderers consume them.
// ============================================================

export type GuideSection = {
  heading?: string;
  paragraphs: string[];
  bullets?: string[];
  tip?: string;
};

export type GuidePayload = {
  intro?: string;
  sections: GuideSection[];
  outro?: string;
};

export type RoutineStep = { title: string; detail?: string };

export type RoutinePayload = {
  overview?: string;
  steps: RoutineStep[];
};

export type ChallengeTask = { day: number; title: string; detail?: string };

export type ChallengePayload = {
  duration: number;
  tagline?: string;
  dailyTasks: ChallengeTask[];
  // optional non-daily bonus tasks a man can do anytime
  bonus?: string[];
};

export type ChecklistItem = { label: string; detail?: string };

export type ChecklistPayload = {
  intro?: string;
  items: ChecklistItem[];
};

export type QuizQuestion = {
  question: string;
  options: string[];
  answerIndex: number;
  explain?: string;
};

export type QuizPayload = {
  intro?: string;
  questions: QuizQuestion[];
};

export type TipPayload = { text: string };

export type KnowledgePayload = { body: string };

export type ContentPayload =
  | GuidePayload
  | RoutinePayload
  | ChallengePayload
  | ChecklistPayload
  | QuizPayload
  | TipPayload
  | KnowledgePayload;

// ---------------- safe parsers ----------------

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function arr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

function num(v: unknown, fallback: number): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : fallback;
}

export function parsePayload(
  contentType: string,
  raw: string,
): ContentPayload {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    data = {};
  }
  const o = (data && typeof data === "object" ? data : {}) as Record<string, unknown>;

  switch (contentType) {
    case "GUIDE": {
      const sections = arr(o.sections)
        .filter((s): s is Record<string, unknown> => typeof s === "object" && s !== null)
        .map((s) => ({
          heading: str(s.heading).trim() || undefined,
          paragraphs: arr(s.paragraphs).filter((p): p is string => typeof p === "string"),
          bullets: arr(s.bullets).filter((b): b is string => typeof b === "string"),
          tip: str(s.tip).trim() || undefined,
        }))
        .filter((s) => s.paragraphs.length > 0 || s.bullets?.length || s.heading);
      return { intro: str(o.intro) || undefined, sections, outro: str(o.outro) || undefined };
    }
    case "ROUTINE": {
      const steps = arr(o.steps)
        .filter((s): s is Record<string, unknown> => typeof s === "object" && s !== null)
        .map((s) => ({ title: str(s.title), detail: str(s.detail) || undefined }))
        .filter((s) => s.title);
      return { overview: str(o.overview) || undefined, steps };
    }
    case "CHALLENGE": {
      const dailyTasks = arr(o.dailyTasks)
        .filter((t): t is Record<string, unknown> => typeof t === "object" && t !== null)
        .map((t) => ({ day: num(t.day, 1), title: str(t.title), detail: str(t.detail) || undefined }))
        .filter((t) => t.title);
      return {
        duration: Math.max(1, dailyTasks.length || num(o.duration, 7)),
        tagline: str(o.tagline) || undefined,
        dailyTasks,
        bonus: arr(o.bonus).filter((b): b is string => typeof b === "string"),
      };
    }
    case "CHECKLIST": {
      const items = arr(o.items)
        .filter((i): i is Record<string, unknown> => typeof i === "object" && i !== null)
        .map((i) => ({ label: str(i.label), detail: str(i.detail) || undefined }))
        .filter((i) => i.label);
      return { intro: str(o.intro) || undefined, items };
    }
    case "QUIZ": {
      const questions = arr(o.questions)
        .filter((q): q is Record<string, unknown> => typeof q === "object" && q !== null)
        .map((q) => ({
          question: str(q.question),
          options: arr(q.options).filter((x): x is string => typeof x === "string").slice(0, 6),
          answerIndex: Number(q.answerIndex) || 0,
          explain: str(q.explain) || undefined,
        }))
        .filter((q) => q.question && q.options.length >= 2);
      return { intro: str(o.intro) || undefined, questions };
    }
    case "TIP":
      return { text: str(o.text) };
    case "KNOWLEDGE":
      return { body: str(o.body) };
    default:
      return { text: "" } as TipPayload;
  }
}

// ---------------- flat text & reading estimates ----------------

export function payloadToText(contentType: string, raw: string): string {
  try {
    const p = parsePayload(contentType, raw);
    const parts: string[] = [];
    const push = (s?: string) => {
      if (s) parts.push(s);
    };

    if ("intro" in p && p.intro) push(p.intro);
    if ("outro" in p && p.outro) push(p.outro);
    if ("overview" in p && p.overview) push(p.overview);
    if ("tagline" in p && p.tagline) push(p.tagline);
    if ("body" in p && p.body) push(p.body);
    if ("text" in p && p.text) push(p.text);

    if ("sections" in p && Array.isArray(p.sections)) {
      for (const s of p.sections) {
        push(s.heading);
        s.paragraphs.forEach(push);
        (s.bullets ?? []).forEach(push);
        push(s.tip);
      }
    }
    if ("steps" in p && Array.isArray(p.steps)) {
      for (const s of p.steps) {
        push(s.title);
        push(s.detail);
      }
    }
    if ("dailyTasks" in p && Array.isArray(p.dailyTasks)) {
      for (const t of p.dailyTasks) {
        push(t.title);
        push(t.detail);
      }
    }
    if ("items" in p && Array.isArray(p.items)) {
      for (const i of p.items) {
        push(i.label);
        push(i.detail);
      }
    }
    if ("questions" in p && Array.isArray(p.questions)) {
      for (const q of p.questions) {
        push(q.question);
        q.options.forEach(push);
        push(q.explain);
      }
    }
    if ("bonus" in p && Array.isArray(p.bonus)) p.bonus.forEach(push);

    return parts.join(" ").replace(/\s+/g, " ").trim();
  } catch {
    return "";
  }
}

export function estimateReadingMinutes(contentType: string, payload: string): number {
  const words = payloadToText(contentType, payload).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 210));
}