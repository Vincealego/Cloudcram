import { CERT } from "./certs/az900";
import type { Attempt } from "./readiness";
import { accuracy } from "./readiness";
// Greedy allocation: weaker and heavier-weighted domains get more days. Call again after every quiz.
export function plan(att: Attempt[], examDate: string, weeklyHours: number, today = new Date()) {
  const acc = accuracy(att), t = acc.map(() => 0);
  const score = acc.map(a => (1.2 - (a.p ?? 0.5)) * a.weight);
  const days = Math.max(0, Math.round((+new Date(examDate) - +today) / 864e5));
  return Array.from({ length: Math.min(days + 1, 14) }, (_, i) => {
    const left = days - i, minutes = Math.round((weeklyHours / 7) * 60);
    if (left === 0) return { day: i, minutes: 0, task: "Exam day: light flashcard review, rest." };
    if (left === 1) return { day: i, minutes, task: "Mixed quiz and clear due flashcards." };
    let b = 0; score.forEach((s, d) => { if (s / (t[d] + 1) > score[b] / (t[b] + 1)) b = d; }); t[b]++;
    return { day: i, minutes, task: `${CERT.domains[b].name}: Learn module, then 5 questions.` };
  });
}
