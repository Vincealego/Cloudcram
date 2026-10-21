# CloudCram ☁️ (unofficial AZ-900 study companion)
> Unofficial study aid. Not affiliated with, endorsed by, or sponsored by Microsoft. Verify everything against the official Microsoft Learn AZ-900 study guide.

Quiz → Flashcards → Planner → Study Buddy → Readiness: one connected loop. A wrong answer creates a flashcard, which feeds the plan, which updates your readiness.

## Setup
1. `npm install`; copy `.env.example` to `.env.local` and fill it in.
2. Run `supabase/schema.sql` in the Supabase SQL editor (row-level security is included).
3. `npm run dev`. Seed `questions` with reviewed rows, or POST to `/api/generate` to grow the bank.
4. The five screens are in `app/page.tsx`. Without keys it runs in demo mode (local storage, offline buddy, reviewed question bank); with keys it adds sign-in, sync and AI. `cloudcram.html` is the standalone demo.
5. `npm test` runs the logic tests.

## Where things live
| Feature | Code |
|---|---|
| Question generation + verification | `app/api/generate/route.ts`, `lib/prompts.ts` |
| Flashcards (spaced repetition) | `lib/srs.ts` |
| Study planner | `lib/planner.ts` |
| Readiness | `lib/readiness.ts` |
| Study Buddy | `app/api/buddy/route.ts` |
| Add another cert | copy `lib/certs/az900.ts` |

## Prompt engineering (the core idea)
1. **Scope-locked generator**: only official objective text may be tested; strict JSON output.
2. **Independent verifier**: a second call answers the question blind. Mismatch means rejected, so only agreed questions reach learners.
3. **Zod + scope checks** before anything is stored.
4. **Honest buddy**: told never to invent features, prices or stats, and to say "not sure" instead.
Still have a human review `approved` questions against Microsoft Learn before launch. An LLM verifier lowers risk but does not remove it.

## Recommendations to stand out
- Show an **objective coverage map** (which official objectives you have never been quizzed on).
- **Low-data mode / PWA** with cached questions, since bundles are costly for many learners.
- **Timed mock exam mode** and a confidence tag ("guessed / sure") to expose lucky guesses.
- **Persona toggle** (shop owner, student, developer) and optional Swahili/French hints.
- A small **prompt eval set**: 30 hand-checked questions run on every prompt change.
- **Shareable readiness card** (no personal data) and a [YOUR STORY HERE] placeholder in the pitch. Add only real stories.
- Accessibility pass: contrast, 44px targets, screen-reader labels.

## Not included yet
shadcn/ui components (plain Tailwind is used), a Supabase-backed question bank read, and UI/end-to-end tests.

## Content source
Objectives and domain ranges follow the Microsoft Learn AZ-900 study guide (skills measured as of January 14, 2026). The 45-question bank is original and written against those objectives; it is not copied from any exam or practice-test source. Re-check the guide when Microsoft updates it.

## Run locally and call the AI
1. `npm install`, then copy `.env.example` to `.env.local` and set `ANTHROPIC_API_KEY` (Supabase is optional).
2. `npm run dev` and open http://localhost:3000. Edit files in `app/` and `lib/`; the page reloads on save.
3. **Study Buddy** (`app/api/buddy/route.ts`) answers any Azure question. It searches learn.microsoft.com and azure.microsoft.com, shows its sources, and falls back to the offline library if the AI is unreachable.
4. **AI questions** (`app/api/generate/route.ts`) search Microsoft Learn while writing, then a second blind call re-checks the answer.
5. The key stays on the server. Never put it in client code or a `NEXT_PUBLIC_` variable. If you see a web-search error, check that web search is enabled for your organisation in the Anthropic Console. The routes then retry without search.

## Storage (Supabase)
Without Supabase keys the app saves to the browser (localStorage). With keys, signing in by email link saves answers, flashcards, exam date and weekly hours to your account and reloads them on any device. Run `supabase/schema.sql` once. The built-in 45 questions live in `lib/seed.json`; the `questions` table only stores AI-generated questions that passed verification.

## Buddy answer order
1. Live AI with web search (needs `ANTHROPIC_API_KEY`, restart the server after editing `.env.local`).
2. If there is no key or the AI call fails, the server searches Microsoft Learn directly and returns official summaries with links.
3. If that also fails, the browser uses the offline library, then shows the real error message.

## No-key mode (default when ANTHROPIC_API_KEY is empty)
The Buddy searches Microsoft Learn live, reads each page's summary, and falls back to Wikipedia. Set `OLLAMA_MODEL` to let a free local model write friendlier answers from those results (local machine only).
