"use client";

import { useEffect, useMemo, useRef, useState, useActionState } from "react";
import { useRouter } from "next/navigation";
import { contentUpsertAction, type AdminActionResult } from "@/actions/admin";
import { CATEGORIES, subcategoriesFor } from "@/lib/site";

type GuideSectionState = {
  heading: string;
  paragraphs: string;
  bullets: string;
  tip: string;
};

type ChallengeDayState = { title: string; detail: string };

type QuizQState = { question: string; options: string; answerIndex: number; explain: string };

type PayloadState = {
  intro: string;
  outro: string;
  sections: GuideSectionState[];
  overview: string;
  steps: { title: string; detail: string }[];
  tagline: string;
  duration: number;
  days: ChallengeDayState[];
  bonus: string;
  items: { label: string; detail: string }[];
  questions: QuizQState[];
  text: string;
  body: string;
};

function splitParas(raw: string): string[] {
  return raw
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function joinParas(arr: string[]): string {
  return arr.join("\n\n");
}

function splitLines(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

function buildPayload(type: string, p: PayloadState): string {
  switch (type) {
    case "GUIDE":
      return JSON.stringify({
        intro: p.intro || undefined,
        sections: p.sections.map((s) => ({
          heading: s.heading || undefined,
          paragraphs: splitParas(s.paragraphs),
          bullets: splitLines(s.bullets),
          tip: s.tip || undefined,
        })),
        outro: p.outro || undefined,
      });
    case "ROUTINE":
      return JSON.stringify({
        overview: p.overview || undefined,
        steps: p.steps.map((s) => ({ title: s.title, detail: s.detail || undefined })),
      });
    case "CHALLENGE":
      return JSON.stringify({
        tagline: p.tagline || undefined,
        duration: p.duration || p.days.length || 7,
        dailyTasks: p.days.map((d, i) => ({
          day: i + 1,
          title: d.title,
          detail: d.detail || undefined,
        })),
        bonus: splitLines(p.bonus),
      });
    case "CHECKLIST":
      return JSON.stringify({
        intro: p.intro || undefined,
        items: p.items.map((i) => ({ label: i.label, detail: i.detail || undefined })),
      });
    case "QUIZ":
      return JSON.stringify({
        intro: p.intro || undefined,
        questions: p.questions.map((q) => ({
          question: q.question,
          options: splitLines(q.options),
          answerIndex: Math.max(0, Math.min(q.answerIndex, splitLines(q.options).length - 1)),
          explain: q.explain || undefined,
        })),
      });
    case "TIP":
      return JSON.stringify({ text: p.text });
    case "KNOWLEDGE":
      return JSON.stringify({ body: p.body });
    default:
      return JSON.stringify({});
  }
}

function initPayloadState(type: string, raw: string): PayloadState {
  const empty: PayloadState = {
    intro: "",
    outro: "",
    sections: [{ heading: "", paragraphs: "", bullets: "", tip: "" }],
    overview: "",
    steps: [{ title: "", detail: "" }],
    tagline: "",
    duration: 7,
    days: Array.from({ length: 7 }, () => ({ title: "", detail: "" })),
    bonus: "",
    items: [{ label: "", detail: "" }],
    questions: [{ question: "", options: "", answerIndex: 0, explain: "" }],
    text: "",
    body: "",
  };

  let data: Record<string, unknown> = {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") data = parsed as Record<string, unknown>;
  } catch {
    /* fresh state */
  }

  const arr = (v: unknown): Record<string, unknown>[] =>
    Array.isArray(v) ? (v.filter((x) => x && typeof x === "object") as Record<string, unknown>[]) : [];
  const s = (v: unknown) => (typeof v === "string" ? v : "");

  switch (type) {
    case "GUIDE":
      return {
        ...empty,
        intro: s(data.intro),
        outro: s(data.outro),
        sections: arr(data.sections).map((sec) => ({
          heading: s(sec.heading),
          paragraphs: joinParas(Array.isArray(sec.paragraphs) ? (sec.paragraphs as string[]) : []),
          bullets: splitLines(s(sec.bullets)).join("\n"),
          tip: s(sec.tip),
        })),
      };
    case "ROUTINE":
      return {
        ...empty,
        overview: s(data.overview),
        steps: arr(data.steps).map((st) => ({ title: s(st.title), detail: s(st.detail) })),
      };
    case "CHALLENGE":
      return {
        ...empty,
        tagline: s(data.tagline),
        duration: Number(data.duration) || 7,
        days: arr(data.dailyTasks).map((d) => ({ title: s(d.title), detail: s(d.detail) })),
        bonus: Array.isArray(data.bonus) ? (data.bonus as string[]).join("\n") : "",
      };
    case "CHECKLIST":
      return {
        ...empty,
        intro: s(data.intro),
        items: arr(data.items).map((i) => ({ label: s(i.label), detail: s(i.detail) })),
      };
    case "QUIZ":
      return {
        ...empty,
        intro: s(data.intro),
        questions: arr(data.questions).map((q) => ({
          question: s(q.question),
          options: Array.isArray(q.options) ? (q.options as string[]).join("\n") : "",
          answerIndex: Number(q.answerIndex) || 0,
          explain: s(q.explain),
        })),
      };
    case "TIP":
      return { ...empty, text: s(data.text) };
    case "KNOWLEDGE":
      return { ...empty, body: s(data.body) };
    default:
      return empty;
  }
}

type BaseState = {
  title: string;
  description: string;
  contentType: string;
  category: string;
  subcategory: string;
  tags: string;
  difficulty: string;
  readingTime: string;
  image: string;
  altText: string;
  authorName: string;
  source: string;
  seoTitle: string;
  seoDescription: string;
  featured: boolean;
  status: string;
};

const EMPTY: BaseState = {
  title: "",
  description: "",
  contentType: "GUIDE",
  category: "BODY",
  subcategory: "",
  tags: "",
  difficulty: "BEGINNER",
  readingTime: "",
  image: "",
  altText: "",
  authorName: "",
  source: "",
  seoTitle: "",
  seoDescription: "",
  featured: false,
  status: "DRAFT",
};

export function ContentEditor({
  id,
  initial,
  initialPayload,
}: {
  id: string | null;
  initial?: Partial<BaseState> & { contentType?: string };
  initialPayload?: string;
}) {
  const router = useRouter();
  const [state, setState] = useState<BaseState>(() => ({
    ...EMPTY,
    ...(initial ?? {}),
    contentType: initial?.contentType ?? EMPTY.contentType,
  }));
  const [payload, setPayload] = useState<PayloadState>(() =>
    initPayloadState(initial?.contentType ?? EMPTY.contentType, initialPayload ?? "{}"),
  );
  const [saved, formAction] = useActionState<AdminActionResult, FormData>(
    (prev, formData) => contentUpsertAction(id, prev, formData),
    {},
  );
  const redirected = useRef(false);
  useEffect(() => {
    if (saved.ok && !redirected.current) {
      redirected.current = true;
      router.push("/admin/content");
    }
  }, [saved.ok, router]);

  const payloadJson = useMemo(
    () => buildPayload(state.contentType, payload),
    [state.contentType, payload],
  );

  const subs = subcategoriesFor(state.category);
  const type = state.contentType;

  const set = <K extends keyof BaseState>(k: K, v: BaseState[K]) =>
    setState((prev) => ({ ...prev, [k]: v }));

  const setP = <K extends keyof PayloadState>(k: K, v: PayloadState[K]) =>
    setPayload((prev) => ({ ...prev, [k]: v }));

  const payloads = saved.ok ?? saved.error;

  return (
    <form
      action={formAction}
      className="form-card form-card--wide"
    >
      <div className="form-row form-row-3">
        <div className="field" style={{ gridColumn: "span 2" }}>
          <label htmlFor="title">Title</label>
          <input id="title" name="title" className="input" value={state.title} onChange={(e) => set("title", e.target.value)} required />
          {saved.fieldErrors?.title && <p className="error-text">{saved.fieldErrors.title[0]}</p>}
        </div>
        <div className="field">
          <label htmlFor="status">Status</label>
          <select id="status" name="status" className="select" value={state.status} onChange={(e) => set("status", e.target.value)}>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      <div className="field">
        <label htmlFor="description">Description (shown on cards + search results)</label>
        <textarea id="description" name="description" className="textarea" rows={2} value={state.description} onChange={(e) => set("description", e.target.value)} required />
        {saved.fieldErrors?.description && <p className="error-text">{saved.fieldErrors.description[0]}</p>}
      </div>

      <div className="form-row form-row-3">
        <div className="field">
          <label htmlFor="contentType">Content type</label>
          <select
            id="contentType"
            name="contentType"
            className="select"
            value={type}
            onChange={(e) => {
              set("contentType", e.target.value);
              setPayload(initPayloadState(e.target.value, "{}"));
            }}
            disabled={!!id}
          >
            {["GUIDE", "TIP", "ROUTINE", "CHALLENGE", "CHECKLIST", "QUIZ", "KNOWLEDGE"].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          {id && <p className="hint">Type is locked after creation.</p>}
        </div>
        <div className="field">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            name="category"
            className="select"
            value={state.category}
            onChange={(e) => {
              set("category", e.target.value);
              set("subcategory", "");
            }}
          >
            {CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="subcategory">Subcategory</label>
          <select id="subcategory" name="subcategory" className="select" value={state.subcategory} onChange={(e) => set("subcategory", e.target.value)}>
            <option value="">—</option>
            {subs.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-row form-row-3">
        <div className="field">
          <label htmlFor="tags">Tags (comma separated)</label>
          <input id="tags" name="tags" className="input" placeholder="grooming, fragrance, routine" value={state.tags} onChange={(e) => set("tags", e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="difficulty">Difficulty</label>
          <select id="difficulty" name="difficulty" className="select" value={state.difficulty} onChange={(e) => set("difficulty", e.target.value)}>
            <option value="BEGINNER">Beginner</option>
            <option value="INTERMEDIATE">Intermediate</option>
            <option value="ADVANCED">Advanced</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="readingTime">Reading time (min, blank = auto)</label>
          <input id="readingTime" name="readingTime" className="input" inputMode="numeric" value={state.readingTime} onChange={(e) => set("readingTime", e.target.value)} />
        </div>
      </div>

      <div className="form-row">
        <div className="field">
          <label htmlFor="image">Image URL (optional)</label>
          <input id="image" name="image" className="input" value={state.image} onChange={(e) => set("image", e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="altText">Image alt text</label>
          <input id="altText" name="altText" className="input" value={state.altText} onChange={(e) => set("altText", e.target.value)} />
        </div>
      </div>

      <div className="form-row">
        <div className="field">
          <label htmlFor="authorName">Author (optional)</label>
          <input id="authorName" name="authorName" className="input" value={state.authorName} onChange={(e) => set("authorName", e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="source">Source (only real, credible sources)</label>
          <input id="source" name="source" className="input" placeholder="e.g. CDC" value={state.source} onChange={(e) => set("source", e.target.value)} />
        </div>
      </div>

      <div className="form-row">
        <div className="field">
          <label htmlFor="seoTitle">SEO title (optional)</label>
          <input id="seoTitle" name="seoTitle" className="input" value={state.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="seoDescription">SEO description</label>
          <input id="seoDescription" name="seoDescription" className="input" value={state.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} />
        </div>
      </div>

      <div className="field" style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <input id="featured" name="featured" type="checkbox" checked={state.featured} onChange={(e) => set("featured", e.target.checked)} />
        <label htmlFor="featured" style={{ margin: 0 }}>Featured on home</label>
      </div>

      <hr style={{ border: 0, borderTop: "1px solid var(--line)", margin: "26px 0" }} />

      <p className="eyebrow eyebrow--red">{type} body</p>
      <PayloadEditor type={type} p={payload} setP={setP} />

      <input type="hidden" name="payloadJson" value={payloadJson} />

      {payloads && <p className={`alert ${saved.ok ? "alert-ok" : "alert-error"}`}>{payloads}</p>}

      <div className="hero-cta-row" style={{ marginTop: 22 }}>
        <button className="btn btn--gold" type="submit">
          {id ? "Save changes" : "Create piece"}
        </button>
        <button type="button" className="btn btn--ghost" onClick={() => router.push("/admin/content")}>
          Back to library
        </button>
      </div>
    </form>
  );
}

function PayloadEditor({
  type,
  p,
  setP,
}: {
  type: string;
  p: PayloadState;
  setP: <K extends keyof PayloadState>(k: K, v: PayloadState[K]) => void;
}) {
  if (type === "TIP") {
    return (
      <div className="field">
        <label>The tip</label>
        <textarea className="textarea" rows={4} value={p.text} onChange={(e) => setP("text", e.target.value)} placeholder="One sharp, actionable piece of advice." />
      </div>
    );
  }

  if (type === "KNOWLEDGE") {
    return (
      <div className="field">
        <label>Knowledge body</label>
        <textarea className="textarea" rows={8} value={p.body} onChange={(e) => setP("body", e.target.value)} placeholder="A compact, genuinely interesting piece of knowledge." />
      </div>
    );
  }

  if (type === "GUIDE") {
    return (
      <div className="list-stack">
        <div className="field">
          <label>Intro hook</label>
          <textarea className="textarea" rows={2} value={p.intro} onChange={(e) => setP("intro", e.target.value)} />
        </div>
        {p.sections.map((sec, i) => (
          <div key={i} className="form-card" style={{ padding: 18 }}>
            <div className="form-row" style={{ alignItems: "center" }}>
              <span className="eyebrow">Section {i + 1}</span>
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => setP("sections", p.sections.filter((_, j) => j !== i))}
                disabled={p.sections.length <= 1}
              >
                Remove
              </button>
            </div>
            <div className="field">
              <label>Heading</label>
              <input className="input" value={sec.heading} onChange={(e) => setP("sections", p.sections.map((s, j) => (j === i ? { ...s, heading: e.target.value } : s)))} />
            </div>
            <div className="field">
              <label>Paragraphs (blank line separates paragraphs)</label>
              <textarea className="textarea" rows={5} value={sec.paragraphs} onChange={(e) => setP("sections", p.sections.map((s, j) => (j === i ? { ...s, paragraphs: e.target.value } : s)))} />
            </div>
            <div className="field">
              <label>Bullets (one per line)</label>
              <textarea className="textarea" rows={3} value={sec.bullets} onChange={(e) => setP("sections", p.sections.map((s, j) => (j === i ? { ...s, bullets: e.target.value } : s)))} />
            </div>
            <div className="field">
              <label>Tip (optional one-liner)</label>
              <input className="input" value={sec.tip} onChange={(e) => setP("sections", p.sections.map((s, j) => (j === i ? { ...s, tip: e.target.value } : s)))} />
            </div>
          </div>
        ))}
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => setP("sections", [...p.sections, { heading: "", paragraphs: "", bullets: "", tip: "" }])}
        >
          Add section
        </button>
        <div className="field">
          <label>Outro (optional)</label>
          <textarea className="textarea" rows={2} value={p.outro} onChange={(e) => setP("outro", e.target.value)} />
        </div>
      </div>
    );
  }

  if (type === "ROUTINE") {
    return (
      <div className="list-stack">
        <div className="field">
          <label>Overview</label>
          <input className="input" value={p.overview} onChange={(e) => setP("overview", e.target.value)} />
        </div>
        {p.steps.map((st, i) => (
          <div key={i} className="form-card" style={{ padding: 18 }}>
            <div className="form-row" style={{ alignItems: "center" }}>
              <span className="eyebrow">Step {i + 1}</span>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => setP("steps", p.steps.filter((_, j) => j !== i))} disabled={p.steps.length <= 1}>
                Remove
              </button>
            </div>
            <div className="field">
              <label>Title</label>
              <input className="input" value={st.title} onChange={(e) => setP("steps", p.steps.map((s, j) => (j === i ? { ...s, title: e.target.value } : s)))} />
            </div>
            <div className="field">
              <label>Detail</label>
              <textarea className="textarea" rows={2} value={st.detail} onChange={(e) => setP("steps", p.steps.map((s, j) => (j === i ? { ...s, detail: e.target.value } : s)))} />
            </div>
          </div>
        ))}
        <button type="button" className="btn btn--ghost" onClick={() => setP("steps", [...p.steps, { title: "", detail: "" }])}>
          Add step
        </button>
      </div>
    );
  }

  if (type === "CHALLENGE") {
    return (
      <div className="list-stack">
        <div className="form-row">
          <div className="field">
            <label>Tagline</label>
            <input className="input" value={p.tagline} onChange={(e) => setP("tagline", e.target.value)} />
          </div>
          <div className="field">
            <label>Duration (days)</label>
            <input className="input" inputMode="numeric" value={p.duration} onChange={(e) => setP("duration", Number(e.target.value) || 1)} />
          </div>
        </div>
        {p.days.slice(0, p.duration).map((d, i) => (
          <div key={i} className="form-card" style={{ padding: 18 }}>
            <span className="eyebrow">Day {i + 1}</span>
            <div className="field">
              <label>Task</label>
              <input className="input" value={d.title} onChange={(e) => setP("days", p.days.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
            </div>
            <div className="field">
              <label>Why / how</label>
              <textarea className="textarea" rows={2} value={d.detail} onChange={(e) => setP("days", p.days.map((x, j) => (j === i ? { ...x, detail: e.target.value } : x)))} />
            </div>
          </div>
        ))}
        <div className="field">
          <label>Bonus anytime tasks (one per line)</label>
          <textarea className="textarea" rows={3} value={p.bonus} onChange={(e) => setP("bonus", e.target.value)} />
        </div>
      </div>
    );
  }

  if (type === "CHECKLIST") {
    return (
      <div className="list-stack">
        <div className="field">
          <label>Intro (optional)</label>
          <input className="input" value={p.intro} onChange={(e) => setP("intro", e.target.value)} />
        </div>
        {p.items.map((it, i) => (
          <div key={i} className="form-card" style={{ padding: 18 }}>
            <div className="form-row" style={{ alignItems: "center" }}>
              <span className="eyebrow">Item {i + 1}</span>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => setP("items", p.items.filter((_, j) => j !== i))} disabled={p.items.length <= 1}>
                Remove
              </button>
            </div>
            <div className="field">
              <label>Label</label>
              <input className="input" value={it.label} onChange={(e) => setP("items", p.items.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
            </div>
            <div className="field">
              <label>Detail</label>
              <input className="input" value={it.detail} onChange={(e) => setP("items", p.items.map((x, j) => (j === i ? { ...x, detail: e.target.value } : x)))} />
            </div>
          </div>
        ))}
        <button type="button" className="btn btn--ghost" onClick={() => setP("items", [...p.items, { label: "", detail: "" }])}>
          Add item
        </button>
      </div>
    );
  }

  if (type === "QUIZ") {
    return (
      <div className="list-stack">
        <div className="field">
          <label>Intro (optional)</label>
          <input className="input" value={p.intro} onChange={(e) => setP("intro", e.target.value)} />
        </div>
        {p.questions.map((q, i) => (
          <div key={i} className="form-card" style={{ padding: 18 }}>
            <div className="form-row" style={{ alignItems: "center" }}>
              <span className="eyebrow">Question {i + 1}</span>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => setP("questions", p.questions.filter((_, j) => j !== i))} disabled={p.questions.length <= 1}>
                Remove
              </button>
            </div>
            <div className="field">
              <label>Question</label>
              <input className="input" value={q.question} onChange={(e) => setP("questions", p.questions.map((x, j) => (j === i ? { ...x, question: e.target.value } : x)))} />
            </div>
            <div className="field">
              <label>Options (one per line)</label>
              <textarea className="textarea" rows={4} value={q.options} onChange={(e) => setP("questions", p.questions.map((x, j) => (j === i ? { ...x, options: e.target.value } : x)))} />
            </div>
            <div className="form-row">
              <div className="field">
                <label>Correct option (1-based)</label>
                <input
                  className="input"
                  inputMode="numeric"
                  value={q.answerIndex + 1}
                  onChange={(e) => setP("questions", p.questions.map((x, j) => (j === i ? { ...x, answerIndex: Math.max(1, Number(e.target.value) || 1) - 1 } : x)))}
                />
              </div>
              <div className="field">
                <label>Explanation</label>
                <input className="input" value={q.explain} onChange={(e) => setP("questions", p.questions.map((x, j) => (j === i ? { ...x, explain: e.target.value } : x)))} />
              </div>
            </div>
          </div>
        ))}
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => setP("questions", [...p.questions, { question: "", options: "", answerIndex: 0, explain: "" }])}
        >
          Add question
        </button>
      </div>
    );
  }

  return null;
}