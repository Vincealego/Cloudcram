// Keyless web answers: Microsoft Learn search, then each page's own meta description (clean one-sentence summary).
// Falls back to Wikipedia's intro extract. No API key needed.
export type Item = { title: string; url: string; text: string };
const decode = (t: string) => t.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();
export const cleanQuery = (q: string) => q.replace(/[?!.]+$/, "").replace(/^(please\s+)?(what('s| is| are)|who is|explain|tell me about|define|how does|how do|can you explain|describe)\s+(the\s+|an?\s+)?/i, "").trim() || q;
export const metaDescription = (html: string) => {
  const h = html.slice(0, 60000);
  const m = h.match(/<meta[^>]*\bname=["']description["'][^>]*\bcontent=["']([^"']*)["']/i) || h.match(/<meta[^>]*\bcontent=["']([^"']*)["'][^>]*\bname=["']description["']/i);
  return m ? decode(m[1]) : "";
};
export const firstSentences = (t: string, max = 300) => {
  const s = decode(t); if (s.length <= max) return s;
  const cut = s.slice(0, max), i = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("? "));
  return i > 60 ? cut.slice(0, i + 1) : cut.replace(/\s+\S*$/, "") + "…";
};
const PREFER = /\/(azure|entra|training|credentials|microsoft-365)\//;
const abs = (u: string) => (u.startsWith("http") ? u : `https://learn.microsoft.com${u}`);
const get = (url: string, ms: number) => fetch(url, { signal: AbortSignal.timeout(ms), headers: { "user-agent": "CloudCram/1.0 (study app)" } });

export async function learnItems(q: string): Promise<Item[]> {
  const j: any = await (await get(`https://learn.microsoft.com/api/search?search=${encodeURIComponent(cleanQuery(q))}&locale=en-us&$top=8`, 8000)).json();
  const res: any[] = j.results ?? [];
  const top = [...res.filter(x => PREFER.test(String(x.url))), ...res.filter(x => !PREFER.test(String(x.url)))].slice(0, 3);   // skip noisy hub pages
  const items = await Promise.all(top.map(async x => {
    const url = abs(String(x.url)); let text = "";
    try { text = metaDescription(await (await get(url, 6000)).text()); } catch {}
    return { title: decode(String(x.title).replace(/<[^>]+>/g, "")), url, text: firstSentences(text) };
  }));
  return items.filter(i => i.text);
}
export async function wikiItems(q: string): Promise<Item[]> {
  const u = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(cleanQuery(q))}&gsrlimit=1&prop=extracts%7Cinfo&inprop=url&exintro=1&explaintext=1&exsentences=3&format=json&origin=*`;
  const p: any = Object.values(((await (await get(u, 6000)).json()) as any).query?.pages ?? {})[0];
  return p?.extract ? [{ title: `${p.title} (Wikipedia)`, url: p.fullurl, text: firstSentences(p.extract, 400) }] : [];
}
