export type Topic = { keys: string[]; title: string; text: string };
// Light stemming so "locks" matches "lock" and "zones" matches "zone" (applied to both sides).
const stem = (w: string) => (w.length > 3 && w.endsWith("s") && !w.endsWith("ss") ? w.slice(0, -1) : w);
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").split(/\s+/).filter(Boolean).map(stem).join(" ");
// Whole-word phrase matching. Longer matching keys win. A key starting with "=" must equal the whole question.
export function findTopic(q: string, topics: Topic[]): Topic | null {
  const nq = norm(q), padded = ` ${nq} `; let best: Topic | null = null, bs = 0;
  for (const t of topics) {
    let s = 0;
    for (const k of t.keys) {
      const exact = k.startsWith("="), nk = norm(exact ? k.slice(1) : k);
      if (nk.length < 2) continue;
      if (exact ? nq === nk : padded.includes(` ${nk} `)) s = Math.max(s, exact ? 100 : 10 + nk.length);
    }
    const nt = norm(t.title); if (nt && padded.includes(` ${nt} `)) s = Math.max(s, 30 + nt.length);
    if (s > bs) { bs = s; best = t; }
  }
  return best;
}
