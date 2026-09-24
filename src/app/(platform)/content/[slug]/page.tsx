import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { categoryByKey } from "@/lib/site";
import {
  parsePayload,
  type GuidePayload,
  type RoutinePayload,
  type ChecklistPayload,
  type QuizPayload,
  type ChallengePayload,
} from "@/lib/payload";
import { relatedContent } from "@/lib/recs";
import { ContentCard } from "@/components/ContentCard";
import { SaveButton } from "@/components/SaveButton";
import { RecordView } from "@/components/RecordView";
import { ReadingProgress } from "@/components/ReadingProgress";
import { QuizPlayer } from "@/components/QuizPlayer";
import { ChecklistPlayer } from "@/components/ChecklistPlayer";
import { ChallengeFlow } from "@/components/ChallengeFlow";

export const dynamic = "force-dynamic";

type Params = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const content = await prisma.content.findUnique({
    where: { slug },
  });
  if (!content || content.status !== "PUBLISHED") return { title: "Not found" };

  return {
    title: (content.seoTitle || content.title) ?? "MEN'S ONLY",
    description:
      (content.seoDescription || content.description) ??
      undefined,
    openGraph: {
      title: content.title,
      description: content.description ?? undefined,
    },
  };
}

export default async function ContentPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;

  const content = await prisma.content.findUnique({
    where: { slug },
    include: { category: true },
  });
  if (!content || content.status !== "PUBLISHED") notFound();

  const session = await getSession();
  const cat = categoryByKey(content.category.key);
  const related = await relatedContent(content.id, { limit: 3 });

  let saved = false;
  let challengeProgress: {
    started: boolean;
    completed: boolean;
    currentDay: number;
    daysDone: number[];
  } = { started: false, completed: false, currentDay: 1, daysDone: [] };

  if (session) {
    const sm = await prisma.savedItem.findUnique({
      where: { userId_contentId: { userId: session.userId, contentId: content.id } },
    });
    saved = !!sm;

    if (content.contentType === "CHALLENGE") {
      const cp = await prisma.challengeProgress.findUnique({
        where: { userId_contentId: { userId: session.userId, contentId: content.id } },
        include: { days: true },
      });
      if (cp) {
        challengeProgress = {
          started: true,
          completed: cp.status === "COMPLETED",
          currentDay: cp.currentDay,
          daysDone: cp.days.map((d) => d.day),
        };
      }
    }
  }

  const typeLabel =
    { GUIDE: "Guide", TIP: "Tip", ROUTINE: "Routine", CHALLENGE: "Challenge", CHECKLIST: "Checklist", QUIZ: "Quiz", KNOWLEDGE: "Know-how" }[
      content.contentType
    ] ?? "Read";

  return (
    <>
      <ReadingProgress />
      <RecordView contentId={content.id} />

      <article className="container reader">
        <div className="reader-hero">
          <div className="reader-head">
            <p className="rd-type">{typeLabel}</p>
            <h1>{content.title}</h1>
            <div className="rd-meta">
              <span>{cat?.label ?? content.category.key}</span>
              <span>·</span>
              <span>{content.readingTime ? `${content.readingTime} min read` : "Quick read"}</span>
              <span>·</span>
              <span>{content.views} views</span>
            </div>
            <div className="rd-actions">
              {session ? (
                <SaveButton contentId={content.id} initialSaved={saved} />
              ) : (
                <Link href={`/auth/login?return=/content/${content.slug}`} className="btn btn--ghost btn--sm">
                  Save
                </Link>
              )}
            </div>
            {content.description && <p className="rd-desc">{content.description}</p>}
          </div>
        </div>

        <div className="reader-body">
          {content.contentType === "CHALLENGE" ? (
            session ? (
              (() => {
                const cp = parsePayload("CHALLENGE", content.payload) as ChallengePayload;
                return (
                  <ChallengeFlow
                    contentId={content.id}
                    duration={cp.duration}
                    tagline={cp.tagline}
                    tasks={cp.dailyTasks}
                    progress={challengeProgress}
                  />
                );
              })()
            ) : (
              <ChallengeSignIn slug={content.slug} />
            )
          ) : (
            <ReaderBody contentType={content.contentType} payload={content.payload} />
          )}
        </div>
      </article>

      {related.length > 0 && (
        <section className="container section-block">
          <div className="section-head">
            <h2>Built to stack</h2>
          </div>
          <div className="grid-3">
            {related.map((item) => (
              <ContentCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function ReaderBody({ contentType, payload }: { contentType: string; payload: string }) {
  if (contentType === "TIP") {
    const p = parsePayload("TIP", payload) as { text: string };
    if (!p.text) return <p style={{ color: "var(--muted)" }}>Content coming soon.</p>;
    return (
      <blockquote className="r-quote">{p.text}</blockquote>
    );
  }

  if (contentType === "KNOWLEDGE") {
    const p = parsePayload("KNOWLEDGE", payload) as { body: string };
    return (
      <div>
        {p.body.split(/\n{2,}/).map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>
    );
  }

  switch (contentType) {
    case "GUIDE":
      return <GuideView payload={parsePayload("GUIDE", payload) as GuidePayload} />;
    case "ROUTINE":
      return <RoutineView payload={parsePayload("ROUTINE", payload) as RoutinePayload} />;
    case "CHECKLIST":
      return <ChecklistPlayer payload={parsePayload("CHECKLIST", payload) as ChecklistPayload} />;
    case "QUIZ":
      return <QuizPlayer {...(parsePayload("QUIZ", payload) as QuizPayload)} />;
    default:
      return <p style={{ color: "var(--muted)" }}>Content coming soon.</p>;
  }
}

function ChallengeSignIn({ slug }: { slug: string }) {
  return (
    <div className="form-card form-card--wide" style={{ textAlign: "center" }}>
      <p className="eyebrow">Challenge</p>
      <h2 style={{ fontSize: "clamp(1.6rem,4vw,2.4rem)" }}>Commit. Then show up daily.</h2>
      <p style={{ color: "var(--muted)", maxWidth: 480, margin: "12px auto", lineHeight: 1.7 }}>
        Challenges track your daily progress and streak. Sign in to start the
        clock — or preview the full day list first.
      </p>
      <div className="hero-cta-row" style={{ justifyContent: "center" }}>
        <Link href={`/auth/login?return=/content/${slug}`} className="btn btn--gold">Sign in to start</Link>
        <Link href={`/auth/signup?return=/content/${slug}`} className="btn btn--ghost">Create account</Link>
      </div>
      <ChallengePreview />
    </div>
  );
}

async function ChallengePreview() {
  const rows = await prisma.content.findMany({
    where: { status: "PUBLISHED", contentType: "CHALLENGE" },
    select: { title: true, slug: true, description: true },
    orderBy: { createdAt: "desc" },
    take: 6,
  });
  return (
    <div className="list-stack" style={{ marginTop: 22, textAlign: "left" }}>
      {rows.map((r) => (
        <Link key={r.slug} href={`/content/${r.slug}`} className="mini-card">
          <div style={{ minWidth: 0 }}>
            <h3>{r.title}</h3>
            <p className="mc-desc">{r.description}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

function GuideView({ payload }: { payload: GuidePayload }) {
  if (payload.sections.length === 0)
    return <p style={{ color: "var(--muted)" }}>Sections coming soon.</p>;
  return (
    <div>
      {payload.intro && <p className="r-intro">{payload.intro}</p>}
      {payload.sections.map((s, i) => (
        <section className="r-sec" key={i}>
          {s.heading && <h2>{s.heading}</h2>}
          {s.paragraphs.map((p, j) => (
            <p key={j}>{p}</p>
          ))}
          {s.bullets && s.bullets.length > 0 && (
            <ul className="r-bullets">
              {s.bullets.map((b, j) => (
                <li key={j}>{b}</li>
              ))}
            </ul>
          )}
          {s.tip && <div className="r-tip">{s.tip}</div>}
        </section>
      ))}
      {payload.outro && <p style={{ marginTop: 26, color: "var(--muted)" }}>{payload.outro}</p>}
    </div>
  );
}

function RoutineView({ payload }: { payload: RoutinePayload }) {
  if (payload.steps.length === 0)
    return <p style={{ color: "var(--muted)" }}>Steps coming soon.</p>;
  return (
    <div>
      {payload.overview && <p className="r-intro">{payload.overview}</p>}
      <ol className="r-steps">
        {payload.steps.map((s, i) => (
          <li key={i}>
            <span className="step-num">{String(i + 1).padStart(2, "0")}</span>
            <div>
              <h3>{s.title}</h3>
              {s.detail && <p>{s.detail}</p>}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}