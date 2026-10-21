import { CERT } from "./certs/az900";
export type Attempt = { domain: number; correct: boolean };
export function accuracy(att: Attempt[]) {
  return CERT.domains.map(d => { const a = att.filter(x => x.domain === d.id);
    return { ...d, n: a.length, p: a.length ? a.filter(x => x.correct).length / a.length : null }; });
}
// Study heuristic, NOT a prediction. The real exam passing score is 700 on a scale of 1-1000.
export function verdict(att: Attempt[], minPerDomain = 3, bar = 0.8) {
  const acc = accuracy(att);
  if (acc.some(a => a.n < minPerDomain)) return { status: "unknown", msg: `Answer at least ${minPerDomain} questions in every domain.` };
  const weak = acc.filter(a => (a.p ?? 0) < bar).map(a => a.name);
  return weak.length ? { status: "not_ready", msg: `Below ${bar * 100}% in: ${weak.join(", ")}.` }
                     : { status: "ready", msg: "80%+ in every domain. Do mixed quizzes, then book your exam." };
}
