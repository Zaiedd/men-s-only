# MEN'S ONLY — Content Pack Authoring Task

You are contributing **realistic sample content** for a premium men's self-improvement platform.
Your work is used to seed a production-ready content store. Quality over quantity, but volume matters for a good demo.

## Deliverable

Write ONE file: `C:\Users\elshinawy\Documents\Default Project\mens-only\data\seed-content.json`

It must be a single JSON object:

```json
{
  "items": [ ...40-60 item objects, one per ContentRecord... ]
}
```

After writing it, VALIDATE it:
1. Run a JSON parse on the file (node or python) and confirm it parses.
2. Report: total item count, coverage table (contentType x category), and any deviations from this spec.

## ContentRecord shape

```json
{
  "title": "Punchy, useful title (all caps not required; keep it strong)",
  "description": "1-2 sentences describing what the man will get.",
  "contentType": "GUIDE|TIP|ROUTINE|CHALLENGE|CHECKLIST|QUIZ|KNOWLEDGE",
  "category": "BODY|LOOK|MIND|LIFE|KNOWLEDGE",
  "subcategory": "<one key from taxonomy below>",
  "tags": ["lowercase", "short", "tags"],
  "difficulty": "BEGINNER|INTERMEDIATE|ADVANCED",
  "source": null,
  "featured": false,
  "payload": { ... shape depends on contentType ... }
}
```

### Taxonomy (use EXACT keys)

| category | subcategory keys |
|---|---|
| BODY | fitness, nutrition, sleep, recovery |
| LOOK | style, hair, skin, grooming, fragrance |
| MIND | discipline, confidence, focus, mindset |
| LIFE | career, money, communication, relationships, social |
| KNOWLEDGE | skills, psychology, etiquette, general |

### payload shapes (exact)

- **GUIDE** (long-form):
```json
{ "intro": "2-3 sentence hook", "sections": [ { "heading": "Section title", "paragraphs": ["...", "..."], "bullets": ["..."], "tip": "optional one-liner" } ], "outro": "optional closing" }
```
Each guide: 4-7 sections, 2-4 paragraphs each.

- **TIP** (short):
```json
{ "text": "One sharp, actionable piece of advice." }
```

- **ROUTINE**:
```json
{ "overview": "one sentence", "steps": [ { "title": "Step", "detail": "what/why/how" } ] }
```
6-10 steps.

- **CHALLENGE**:
```json
{ "tagline": "one line", "dailyTasks": [ { "day": 1, "title": "TASK", "detail": "why it matters / how to do it" } ] }
```
3 challenges durations mix: 7-day, 14-day, 30-day. Each day must have a real task (no filler).

- **CHECKLIST**:
```json
{ "intro": "optional", "items": [ { "label": "actionable item", "detail": "optional short explanation" } ] }
```
8-14 items.

- **QUIZ**:
```json
{ "intro": "optional", "questions": [ { "question": "?", "options": ["a", "b", "c"], "answerIndex": 0, "explain": "why" } ] }
```
4-8 questions, each 2-5 options, answerIndex is the correct one (0-based).

- **KNOWLEDGE**:
```json
{ "body": "A compact, genuinely interesting and useful piece of knowledge (1-3 short paragraphs)." }
```

## Coverage requirements

- 40-60 items total.
- ALL 7 contentTypes present (min counts: GUIDE ≥ 5, TIP ≥ 8, ROUTINE ≥ 6, CHALLENGE ≥ 6, CHECKLIST ≥ 4, QUIZ ≥ 4, KNOWLEDGE ≥ 6).
- ALL 5 categories present; every subcategory should have at least one item.

## Mandatory flagship items (exact or near-exact titles)

- featured:true — a GUIDE titled **"The Art of Looking Good"** (category LOOK, subcategory style).
- featured:true — a GUIDE titled **"How To Smell Better"** (category LOOK, subcategory grooming) — must contain words "fragrance", "apply", "routine" in the body so search matches "How do I smell better?" and "where to apply fragrance".
- A CHALLENGE titled **"7 Days of Discipline"** (category MIND, subcategory discipline) — classic daily discipline tasks.
- A CHALLENGE **"14 Days of Better Grooming"** (LOOK / grooming).
- A CHALLENGE **"30 Days of Fitness Consistency"** (BODY / fitness).
- A CHALLENGE **"7 Days of No Procrastination"** (MIND / focus).
- A ROUTINE **"The Perfect Daily Grooming Routine"** (LOOK / grooming).
- A KNOWLEDGE item about sleep (BODY / sleep) — e.g. "The Real Cost of Skipping Sleep".
- A TIP titled **"Where To Apply Fragrance"** (LOOK / fragrance).

## Voice & quality rules (VERY IMPORTANT)

1. Voice: direct, confident, practical, mature. Second person ("you"). Premium masculine but never toxic, never mocking. Framing = improvement, not perfectionism.
2. Zero hype. No "This will change your life instantly." Be honest and useful.
3. **Do NOT fabricate medical/scientific claims.** Never invent statistics, studies, or citations. Topics like nutrition, fitness, sleep, skin, recovery are evidence-sensitive: keep advice general, sensible, and clearly educational. If you state a specific numeric fact that is widely documented (e.g., "most adults need 7-9 hours of sleep" — common public-health guidance), you may set `"source"` to a reputable public body (e.g., "CDC", "NIH", "WHO", "American Academy of Sleep Medicine", "ACSM", "Mayo Clinic") ONLY if the fact genuinely comes from general public guidance. When in doubt, do NOT attribute a source; keep the claim general and add wording like "general guidance suggests".
4. No lorem ipsum anywhere. Every word must be real, useful content a man would want to read.
5. Tags: lowercase, kebab/hyphen optional, 2-5 per item, genuinely related (e.g. ["grooming","fragrance","routine"]).
6. Titles: strong but tasteful. Do not use ALL CAPS for whole titles.
7. Realistic variety: mix difficulties. Mark 2-4 more items featured:true (pick genuinely strong ones).

## Constraints

- ONLY create the file above. Do not touch any other file or folder.
- Keep the JSON valid (watch trailing commas, quote escaping).
- Use `\n` inside strings? No — use actual newlines in the strings; JSON will store them. Avoid heavy ASCII art.