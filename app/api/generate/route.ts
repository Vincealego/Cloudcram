import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { GENERATOR, VERIFIER } from "@/lib/prompts";
import { OBJECTIVES } from "@/lib/certs/az900";

// AI + web search can take several seconds; give Vercel functions room to finish.
export const maxDuration = 60;

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5-5";
const tools: any[] = [{ type: "web_search_20250305", name: "web_search", max_uses: 2, allowed_domains: ["learn.microsoft.com"] }];
const Q = z.object({ domain: z.number().int().min(0).max(2), objective: z.string(), stem: z.string().min(15),
  options: z.array(z.string()).length(4), correct: z.number().int().min(0).max(3), explanation: z.string().min(30) });

async function call(system: string, user: string) {
  const ai = new Anthropic();
  const go = async (web: boolean) => {
    const messages: any[] = [{ role: "user", content: user }];
    for (let i = 0; i < 3; i++) {
      const r: any = await ai.messages.create({ model: MODEL, max_tokens: 1000, system, messages, ...(web ? { tools } : {}) } as any);
      if (r.stop_reason !== "pause_turn") return r;
      messages.push({ role: "assistant", content: r.content });
    }
    throw new Error("Too many pauses");
  };
  let r: any; try { r = await go(true); } catch { r = await go(false); }
  const text = r.content.filter((c: any) => c.type === "text").map((c: any) => c.text).join("");
  return JSON.parse((text.match(/\{[\s\S]*\}/) ?? [""])[0]);          // tolerate text around the JSON
}

// POST {objective?: string}. Pipeline: generate (checks Microsoft Learn), schema + scope check, blind verify (checks again), optional store.
export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) return Response.json({ error: "no_key" }, { status: 503 });
  const { objective } = await req.json().catch(() => ({}));
  const target = objective ?? OBJECTIVES[Math.floor(Math.random() * OBJECTIVES.length)].objective;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const q = Q.parse(await call(GENERATOR, `Write one question for the objective: ${target}`));
      if (!OBJECTIVES.some(o => o.objective === q.objective)) continue;            // out of scope
      const { correct, ...blind } = q;
      const v = await call(VERIFIER, JSON.stringify(blind));                        // verifier never sees the key
      if (v.verdict !== "pass" || v.your_answer !== correct) continue;
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (url && key) {                                                             // storing is optional locally
        const { data } = await createClient(url, key).from("questions").insert({ cert: "az900", ...q, status: "approved" }).select().single();
        if (data) return Response.json(data);
      }
      return Response.json({ id: `ai-${Date.now()}`, ...q });
    } catch { /* retry */ }
  }
  return Response.json({ error: "No question passed verification. Use the reviewed seed bank." }, { status: 502 });
}
