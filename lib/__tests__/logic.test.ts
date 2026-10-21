import { describe, it, expect } from "vitest";
import { review } from "../srs"; import { verdict } from "../readiness"; import { plan } from "../planner";
import seed from "../seed.json"; import { OBJECTIVES } from "../certs/az900";
const mk = (d: number, ok: number, n: number) => Array.from({ length: n }, (_, i) => ({ domain: d, correct: i < ok }));
describe("srs", () => {
  it("promotes on success and resets on failure", () => { expect(review(0, true).box).toBe(1); expect(review(4, true).box).toBe(4); expect(review(3, false).box).toBe(0); });
});
describe("readiness", () => {
  it("needs data in every domain", () => expect(verdict(mk(0, 3, 3)).status).toBe("unknown"));
  it("flags weak domains", () => expect(verdict([...mk(0, 5, 5), ...mk(1, 2, 5), ...mk(2, 5, 5)]).status).toBe("not_ready"));
  it("passes at 80%+ everywhere", () => expect(verdict([...mk(0, 4, 5), ...mk(1, 4, 5), ...mk(2, 5, 5)]).status).toBe("ready"));
});
describe("planner", () => {
  it("favours the weakest domain", () => {
    const t = plan([...mk(0, 5, 5), ...mk(1, 1, 5), ...mk(2, 5, 5)], new Date(Date.now() + 10 * 864e5).toISOString(), 7);
    expect(t.filter(x => x.task.startsWith("Azure architecture")).length).toBeGreaterThan(t.filter(x => x.task.startsWith("Cloud")).length);
  });
});
describe("seed bank", () => {
  it("is well-formed", () => seed.forEach(q => { expect(q.options).toHaveLength(4); expect(q.correct).toBeGreaterThanOrEqual(0); expect(q.correct).toBeLessThan(4); }));
  it("covers every domain", () => expect(new Set(seed.map(q => q.domain)).size).toBe(3));
  it("has objectives defined", () => expect(OBJECTIVES.length).toBeGreaterThan(0));
});
