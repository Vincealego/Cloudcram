import Anthropic from "@anthropic-ai/sdk";
import { BUDDY } from "@/lib/prompts";
import { learnItems, wikiItems, type Item } from "@/lib/websearch";

// AI + web search can take several seconds; give Vercel functions room to finish.
export const maxDuration = 60;

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5-5";
// Server-side web search, limited to Microsoft's own documentation so answers are checkable.
const tools: any[] = [{ type: "web_search_20250305", name: "web_search", max_uses: 3,
  allowed_domains: ["learn.microsoft.com", "azure.microsoft.com"] }];

// Keyless mode: live web search (Microsoft Learn, then Wikipedia). If OLLAMA_MODEL is set, a free local model
// (https://ollama.com) turns those snippets into a friendly answer. Otherwise the clean summaries are shown as-is.
async function ollama(question: string, persona: string, ctx: string) {
  const model = process.env.OLLAMA_MODEL; if (!model) return null;
  const r = await fetch(`${process.env.OLLAMA_URL ?? "http://localhost:11434"}/api/chat`, { method: "POST", headers: { "content-type": "application/json" }, signal: AbortSignal.timeout(90000),
    body: JSON.stringify({ model, stream: false, messages: [{ role: "system", content: BUDDY(persona) + "\nUse ONLY the SOURCES below for facts. If they do not answer the question, say so.\nSOURCES:\n" + ctx }, { role: "user", content: question }] }) });
  return ((await r.json()) as any).message?.content?.trim() || null;
}
async function keyless(question: string, persona: string) {
  let items: Item[] = await learnItems(question).catch(() => []);
  if (!items.length) items = await wikiItems(question).catch(() => []);
  if (!items.length) return null;
  const ai = await ollama(question, persona, items.map(i => `${i.title}: ${i.text}`).join("\n")).catch(() => null);
  const answer = ai ?? "Here’s what the web says (live search, no AI key):\n\n" + items.map(i => `• ${i.title}: ${i.text}`).join("\n\n");
  return { answer, sources: items.map(({ title, url }) => ({ title, url })), web: true, mode: ai ? "local-ai" : "search" };
}

export async function POST(req: Request) {
  const { question, persona = "a friendly tutor" } = await req.json().catch(() => ({}));
  if (typeof question !== "string" || !question.trim() || question.length > 600)
    return Response.json({ error: "Bad input" }, { status: 400 });
  if (!process.env.ANTHROPIC_API_KEY) {
    const f = await keyless(question, String(persona).slice(0, 60)).catch(() => null);
    return f ? Response.json(f) : Response.json({ error: "no_key" }, { status: 503 });
  }
  const ai = new Anthropic();

  const run = async (web: boolean) => {
    const messages: any[] = [{ role: "user", content: question }];
    for (let i = 0; i < 3; i++) {                       // server tools can pause long turns; resume them
      const r: any = await ai.messages.create({ model: MODEL, max_tokens: 800, system: BUDDY(String(persona).slice(0, 60)),
        messages, ...(web ? { tools } : {}) } as any);
      if (r.stop_reason !== "pause_turn") return r;
      messages.push({ role: "assistant", content: r.content });
    }
    throw new Error("Too many pauses");
  };
  try {
    let r: any, web = true;
    try { r = await run(true); } catch { web = false; r = await run(false); }   // fall back to no-search answer
    const blocks: any[] = r.content, src = new Map<string, string>();
    blocks.forEach(b => {
      if (b.type === "text") b.citations?.forEach((c: any) => c.url && src.set(c.url, c.title || c.url));
      if (b.type === "web_search_tool_result" && Array.isArray(b.content))
        b.content.forEach((c: any) => c.url && src.size < 4 && !src.has(c.url) && src.set(c.url, c.title || c.url));
    });
    return Response.json({ answer: blocks.filter(b => b.type === "text").map(b => b.text).join("").trim(),
      sources: [...src].slice(0, 4).map(([url, title]) => ({ url, title })), web });
  } catch (e: any) {
    const f = await keyless(question, String(persona).slice(0, 60)).catch(() => null);        // AI failed: still give official summaries
    return f ? Response.json({ ...f, note: e?.message }) : Response.json({ error: e?.message ?? "AI request failed" }, { status: 502 });
  }
}
