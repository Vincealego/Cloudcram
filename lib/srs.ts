// Leitner-style spaced repetition. Right answer: move up a box (1,2,4,8 days). Wrong: back to box 0.
export const INTERVALS = [0, 1, 2, 4, 8];
export function review(box: number, good: boolean, now = new Date()) {
  const nb = good ? Math.min(box + 1, INTERVALS.length - 1) : 0;
  return { box: nb, due: new Date(now.getTime() + INTERVALS[nb] * 864e5).toISOString() };
}
