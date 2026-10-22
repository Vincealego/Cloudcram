export const dynamic = "force-dynamic";
// Reports which settings the server can see (true/false only, never the values). Open /api/health on your live site to check.
export function GET() {
  const e = process.env;
  return Response.json({ ai: !!e.ANTHROPIC_API_KEY, ollama: !!e.OLLAMA_MODEL, supabaseUrl: !!e.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: !!e.NEXT_PUBLIC_SUPABASE_ANON_KEY, supabaseSecret: !!e.SUPABASE_SERVICE_ROLE_KEY });
}
