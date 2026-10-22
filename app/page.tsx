"use client";
import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { CERT } from "@/lib/certs/az900";
import { accuracy, verdict, type Attempt } from "@/lib/readiness";
import { plan } from "@/lib/planner";
import { review } from "@/lib/srs";
import { supabase } from "@/lib/supabase";
import seed from "@/lib/seed.json";
import offline from "@/lib/buddy-offline.json";
import { findTopic, type Topic } from "@/lib/buddy";

type Q = { id: string; domain: number; stem: string; options: string[]; correct: number; explanation: string };
type Card = { qid: string; q: string; a: string; domain: number; box: number; due: string };
type Src = { url: string; title: string };
type S = { att: (Attempt & { qid: string; demo?: boolean })[]; cards: Card[]; exam: string; hrs: number };
const Qs = seed as Q[], KEY = "cloudcram.next.v3", day = 864e5, DC = ["#3b82f6", "#8b5cf6", "#10b981"], DOM = CERT.domains.map(d => d.name);
const P: Record<string, string> = { quiz: `<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 1-1 1.7"/><circle cx="12" cy="17" r=".6"/>`, cards: `<rect x="3" y="7" width="14" height="12" rx="2"/><path d="M7 7V5h14v12h-2"/>`,
  plan: `<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>`, buddy: `<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>`, ready: `<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>`,
  bulb: `<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0 0 12 3z"/>`, flame: `<path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z"/>`,
  check: `<path d="M5 12l5 5 9-10"/>`, x: `<path d="M6 6l12 12M18 6L6 18"/>`, moon: `<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>`, send: `<path d="M3 11l18-8-8 18-2-8z"/>`, clock: `<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>`, star: `<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>` };
const Ic = ({ n, s = 20 }: { n: string; s?: number }) => <svg className="ic" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: P[n] }} />;
const Ring = ({ p, c, s = 66, t }: { p: number; c: string; s?: number; t?: string }) => (<div className="rg" style={{ width: s, height: s }}><svg viewBox="0 0 36 36" width={s} height={s} style={{ transform: "rotate(-90deg)" }}>
  <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--tr)" strokeWidth="3.6" /><circle cx="18" cy="18" r="15.9" fill="none" stroke={c} strokeWidth="3.6" strokeLinecap="round" strokeDasharray={`${p} 100`} style={{ transition: "stroke-dasharray .8s" }} /></svg><span>{t ?? p + "%"}</span></div>);
function Gauge({ p }: { p: number }) { const a = Math.PI * .2, x = 50 + 40 * Math.cos(a), y = 50 - 40 * Math.sin(a), d = "M10 50A40 40 0 0 1 90 50";
  return (<svg viewBox="0 0 100 62" className="gauge"><defs><linearGradient id="gg" x1="0" x2="1"><stop offset="0" stopColor="#f43f5e" /><stop offset=".55" stopColor="#f59e0b" /><stop offset="1" stopColor="#10b981" /></linearGradient></defs>
    <path d={d} pathLength="100" fill="none" stroke="var(--tr)" strokeWidth="9" strokeLinecap="round" /><path d={d} pathLength="100" fill="none" stroke="url(#gg)" strokeWidth="9" strokeLinecap="round" strokeDasharray={`${p} 100`} style={{ transition: "stroke-dasharray .8s" }} />
    <line x1={x - 5 * Math.cos(a)} y1={y + 5 * Math.sin(a)} x2={x + 5 * Math.cos(a)} y2={y - 5 * Math.sin(a)} stroke="currentColor" strokeWidth="1.3" />
    <text x="50" y="47" textAnchor="middle" fontSize="17" fontWeight="800" fill="currentColor">{p}%</text><text x="50" y="58" textAnchor="middle" fontSize="5.5" fill="var(--mu)">practice accuracy · line = 80%</text></svg>); }
const Cloud = () => (<svg className="cl" width="132" height="92" viewBox="0 0 132 92" aria-hidden><defs><linearGradient id="cg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff" /><stop offset="1" stopColor="#bfdbfe" /></linearGradient></defs>
  <path d="M32 70a20 20 0 0 1 2-40 27 27 0 0 1 51-5 22 22 0 0 1 9 45z" fill="url(#cg)" /><path d="M52 52 70 43 86 54" stroke="#6366f1" strokeWidth="2" fill="none" />
  {[[52, 52], [70, 43], [86, 54]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3.8" fill={DC[i]} />)}<circle className="tw" cx="112" cy="14" r="2.2" fill="#fde68a" /><circle className="tw" cx="12" cy="34" r="1.8" fill="#fde68a" /></svg>);
function burst(x: number, y: number) { if (matchMedia("(prefers-reduced-motion:reduce)").matches) return; const f = document.getElementById("fx"); if (!f) return;
  for (let i = 0; i < 22; i++) { const e = document.createElement("i"); e.style.cssText = `left:${x}px;top:${y}px;background:${["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#f43f5e"][i % 5]}`; f.appendChild(e);
    const a = Math.random() * 6.28, d = 60 + Math.random() * 90; e.animate([{ transform: "translate(0,0)", opacity: 1 }, { transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d + 60}px) rotate(${Math.random() * 540}deg)`, opacity: 0 }], { duration: 900 + Math.random() * 400 }).onfinish = () => e.remove(); } }
const init = (): S => ({ att: [], cards: [], exam: new Date(Date.now() + 21 * day).toISOString().slice(0, 10), hrs: 6 });

export default function Page() {
  const [s, setS] = useState<S>(init), [tab, setTab] = useState("quiz"), [q, setQ] = useState<Q | null>(null), [pick, setPick] = useState<number | null>(null);
  const [user, setUser] = useState<User | null>(null), [msg, setMsg] = useState(""), [ask, setAsk] = useState(""), [persona, setPersona] = useState("a friendly tutor");
  const [chat, setChat] = useState<{ r: "u" | "b"; t: string; src?: Src[]; typing?: boolean }[]>([{ r: "b", t: "Hi! I explain Azure in simple terms with everyday examples like M-Pesa and data bundles, and I can check Microsoft Learn for anything new. Ask me anything." }]);

  const [mode, setMode] = useState<"in" | "up">("up"), [health, setHealth] = useState<{ ai?: boolean; ollama?: boolean }>({}), sRef = useRef(s); sRef.current = s;
  useEffect(() => { fetch("/api/health").then(r => r.json()).then(setHealth).catch(() => {}); }, []);
  useEffect(() => { try { const v = localStorage.getItem(KEY), t = localStorage.getItem(KEY + "t"); if (v) setS(JSON.parse(v)); if (t) document.documentElement.dataset.theme = t; } catch {} }, []);
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {} }, [s]);
  useEffect(() => { if (!supabase) return; supabase.auth.getUser().then(r => setUser(r.data.user));
    const { data } = supabase.auth.onAuthStateChange((_e, ses) => setUser(ses?.user ?? null)); return () => data.subscription.unsubscribe(); }, []);
  useEffect(() => { if (!supabase || !user) return; (async () => { // load saved progress for this account
    const [a, c, p] = await Promise.all([supabase!.from("attempts").select("question_id,domain,correct").eq("user_id", user.id).order("id"),
      supabase!.from("cards").select("question_id,box,due").eq("user_id", user.id), supabase!.from("profiles").select("exam_date,weekly_hours").eq("id", user.id).maybeSingle()]);
    const att = (a.data ?? []).map(x => ({ domain: x.domain, correct: x.correct, qid: x.question_id }));
    const cards = (c.data ?? []).flatMap(x => { const k = Qs.find(z => z.id === x.question_id); return k ? [{ qid: k.id, q: k.stem, a: k.options[k.correct], domain: k.domain, box: x.box, due: x.due }] : []; });
    const loc = sRef.current;
    if (!att.length && loc.att.length) { // first sign-in: keep what the guest already did and save it to the account
      await supabase!.from("attempts").insert(loc.att.map(a => ({ user_id: user.id, question_id: a.qid, domain: a.domain, correct: a.correct })));
      if (loc.cards.length) await supabase!.from("cards").upsert(loc.cards.map(c => ({ user_id: user.id, question_id: c.qid, box: c.box, due: c.due })));
      setMsg("Your progress is now saved to your account."); return; }
    setS(o => ({ ...o, att, cards, exam: p.data?.exam_date ?? o.exam, hrs: p.data?.weekly_hours ?? o.hrs })); setQ(null); setMsg(att.length ? "Progress loaded from your account." : ""); })(); }, [user]);
  useEffect(() => { if (supabase && user) supabase.from("profiles").upsert({ id: user.id, exam_date: s.exam, weekly_hours: s.hrs }).then(); }, [s.exam, s.hrs, user]);
  useEffect(() => { if (!q) nextQ(); }, [s.att.length, q]);
  useEffect(() => { const c = document.querySelector(".chat"); if (c) c.scrollTop = c.scrollHeight; }, [chat]);

  function nextQ(ai?: Q) {
    if (ai) { setQ(ai); setPick(null); return; }
    const seen = new Set(s.att.map(a => a.qid)), acc = accuracy(s.att); let pool = Qs.filter(x => !seen.has(x.id)); if (!pool.length) pool = Qs;
    const w = (x: Q) => 1.2 - (acc[x.domain].p ?? 0.5) + Math.random(); setQ([...pool].sort((a, b) => w(b) - w(a))[0]); setPick(null);
  }
  async function genAI() {
    setMsg("Writing a question and checking it against Microsoft Learn…");
    try { const r = await fetch("/api/generate", { method: "POST", body: "{}" }); const d = await r.json(); if (!r.ok) throw 0; setMsg(""); nextQ(d); }
    catch { setMsg("AI questions aren’t available right now (check your API key). Using the reviewed bank."); nextQ(); }
  }
  function answer(i: number, e: React.MouseEvent) {
    if (!q || pick !== null) return; setPick(i); const ok = i === q.correct;
    const c: Card = { qid: q.id, q: q.stem, a: q.options[q.correct], domain: q.domain, box: 0, due: new Date().toISOString() };
    setS(p => ({ ...p, att: [...p.att, { domain: q.domain, correct: ok, qid: q.id }], cards: ok || p.cards.some(x => x.qid === q.id) ? p.cards : [...p.cards, c] }));
    if (ok) burst(e.clientX, e.clientY);
    if (supabase && user) { supabase.from("attempts").insert({ user_id: user.id, question_id: q.id, domain: q.domain, correct: ok }).then();
      if (!ok) supabase.from("cards").upsert({ user_id: user.id, question_id: q.id, box: 0, due: c.due }).then(); }
  }
  const due = s.cards.filter(c => new Date(c.due) <= new Date()); const [flip, setFlip] = useState(false);
  function grade(good: boolean) { const c = due[0]; if (!c) return; const r = review(c.box, good); setFlip(false);
    setS(p => ({ ...p, cards: p.cards.map(x => x.qid === c.qid ? { ...x, ...r } : x) }));
    if (supabase && user) supabase.from("cards").upsert({ user_id: user.id, question_id: c.qid, ...r }).then(); }
  async function buddy(t = ask, fallback?: string) {
    if (!t.trim()) return; setAsk("");
    const more: Src[] = [{ url: `https://learn.microsoft.com/en-us/search/?terms=${encodeURIComponent(t.slice(0, 120))}`, title: "Search Microsoft Learn for more" }];
    setChat(c => [...c, { r: "u", t }, { r: "b", t: "", typing: true }]);
    const reply = (text: string, src: Src[] = more) => setChat(c => [...c.slice(0, -1), { r: "b", t: text, src }]);
    const m = fallback ? null : findTopic(t, offline as Topic[]);          // library first: instant and curated
    if (m) { await new Promise(r => setTimeout(r, 400)); return reply(`${m.title}: ${m.text}`); }
    try { const r = await fetch("/api/buddy", { method: "POST", body: JSON.stringify({ question: t, persona }) }); const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error ?? "request failed");
      if (fallback && j.mode === "search") return reply(fallback);
      reply(j.answer, j.sources?.length ? j.sources : more);
    } catch (e) { const msg = (e as Error).message;
      reply(fallback ?? (msg === "no_key" ? "I couldn’t find a good match in my library or in a live web search. Try rephrasing (for example “what is vertical scaling?”) or use the link below."
        : `The AI request failed: ${msg}. Check your key, your API billing credit, and that web search is enabled in the Anthropic Console.`)); }
  }
  async function auth(m: "in" | "up", email: string, password: string) {
    if (!supabase) return setMsg("Accounts aren’t switched on for this site yet. The site owner needs to add the Supabase settings.");
    const { data, error } = m === "up" ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: location.origin } }) : await supabase.auth.signInWithPassword({ email, password });
    if (error) return setMsg(error.message);
    if (m === "up" && !data.session) return setMsg("Account created. Check your email to confirm it, then sign in.");
    setMsg(m === "up" ? "Account created. You’re signed in." : "Signed in."); setTab("quiz");
  }
  const theme = () => { const r = document.documentElement, dk = r.dataset.theme ? r.dataset.theme === "dark" : matchMedia("(prefers-color-scheme:dark)").matches; r.dataset.theme = dk ? "light" : "dark"; try { localStorage.setItem(KEY + "t", r.dataset.theme); } catch {} };

  const acc = accuracy(s.att), p = plan(s.att, s.exam, s.hrs), v = verdict(s.att), ov = s.att.length ? Math.round(100 * s.att.filter(a => a.correct).length / s.att.length) : 0;
  const real = s.att.filter(a => !a.demo).length, seen = new Set(s.att.filter(a => !a.demo).map(a => a.qid)).size, mastered = s.cards.filter(c => c.box >= 3).length;
  let st = 0; for (let i = s.att.length - 1; i >= 0 && s.att[i].correct; i--) st++;
  const wk = [...acc].sort((a, b) => (a.p ?? .5) - (b.p ?? .5))[0], daysLeft = Math.max(0, Math.round((+new Date(s.exam) - Date.now()) / day));
  const vc = v.status === "ready" ? "ok" : v.status === "not_ready" ? "no" : "wn", vt = { ready: "Looking exam-ready", not_ready: "Not exam-ready yet", unknown: "Not enough data yet" }[v.status as "ready"];
  const tabs: [string, string][] = [["quiz", "Quiz"], ["cards", "Cards"], ["plan", "Plan"], ["buddy", "Buddy"], ["ready", "Ready"]];

  return (<>
    <div className="hero"><button className="tg" onClick={theme} aria-label="Toggle theme"><Ic n="moon" s={18} /></button>
      <div className="hr"><div><h1>Cloud<span>Cram</span></h1><small>{CERT.name}</small><small style={{ opacity: .75, fontSize: 12 }}>{user ? `Saved to ${user.email}` : "Guest: progress saved in this browser"}</small></div><Cloud /></div>
      <div className="pills"><span><Ic n="flame" s={14} /> {st} streak</span><span>{due.length} cards due</span><span>Level {1 + Math.floor(real / 5)}<span className="xp"><i style={{ width: `${(real % 5) * 20}%` }} /></span></span><button className="pb" onClick={() => setTab("account")}>{user ? "Account" : "Sign in"}</button></div></div>
    {msg && <p role="status" className="tip glass">{msg}</p>}
    <div key={tab} className="in">
      {tab === "quiz" && q && <>{s.att.length > 0 && <div className="tip glass"><Ic n="star" s={18} /><span>Focus area: <b>{wk.name}</b> ({wk.p === null ? "–" : Math.round(wk.p * 100) + "%"})</span></div>}
        <div key={q.id} className="card glass q in" style={{ ["--a" as string]: DC[q.domain] }}>
          <div className="top"><span className="chip" style={{ background: DC[q.domain] }}>{DOM[q.domain]}</span><span className="dots">{s.att.slice(-10).map((a, i) => <i key={i} className={a.correct ? "g" : "r"} />)}</span></div>
          <h2>{q.stem}</h2>
          {q.options.map((o, i) => <button key={i} className={`opt ${pick === null ? "" : i === q.correct ? "ok" : i === pick ? "no" : "dim"}`} onClick={e => answer(i, e)}>
            <b>{pick !== null && i === q.correct ? <Ic n="check" s={16} /> : pick === i ? <Ic n="x" s={16} /> : "ABCD"[i]}</b>{o}</button>)}
          {pick !== null && <div className="ex"><h3 style={{ display: "flex", gap: 6, alignItems: "center", color: `var(--${pick === q.correct ? "ok" : "no"})` }}><Ic n="bulb" s={18} />{pick === q.correct ? "Correct!" : "Not quite. Added to your flashcards."}</h3><p>{q.explanation}</p>
            <div className="row"><button className="pri" onClick={() => nextQ()}>Next question →</button>{health.ai && <button className="btn" onClick={genAI}>AI question</button>}
              <button className="btn" onClick={() => { setTab("buddy"); const rel = findTopic(`${q.stem} ${q.options[q.correct]}`, offline as Topic[]); buddy(`Explain this AZ-900 question simply and check it against Microsoft Learn: ${q.stem} Correct answer: ${q.options[q.correct]}`, `Why “${q.options[q.correct]}” is correct: ${q.explanation}${rel ? `\n\nRelated concept (${rel.title}): ${rel.text}` : ""}`); }}>Ask buddy</button></div></div>}
        </div></>}
      {tab === "cards" && <><div className="card glass"><div className="top" style={{ margin: "0 0 8px" }}><b>Mastered</b><span className="mu">{mastered} / {s.cards.length} cards</span></div>
        <div className="bar"><i style={{ width: `${s.cards.length ? 100 * mastered / s.cards.length : 0}%`, background: "linear-gradient(90deg,#34d399,#14b8a6)" }} /></div><p className="mu">Right answers return after 1, 2, 4, then 8 days. A miss resets the card.</p></div>
        {due[0] ? <><div className={`flip ${flip ? "on" : ""}`} onClick={() => setFlip(!flip)}><div className="fi"><div className="face f1"><small>{DOM[due[0].domain]} · {due.length} due</small><p>{due[0].q}</p><small>Tap to reveal the answer</small></div>
          <div className="face f2"><small>Answer</small><p style={{ fontSize: 24 }}>{due[0].a}</p><small>Tap to flip back</small></div></div></div>
          <div className="row"><button className="btn" style={{ flex: 1 }} onClick={() => grade(false)}>Again</button><button className="pri" style={{ flex: 1 }} onClick={() => grade(true)}>Got it</button></div></>
          : <div className="card glass" style={{ textAlign: "center" }}><div style={{ fontSize: 44 }}>🎉</div><h2>All caught up!</h2><p className="mu">Missed quiz questions appear here as new cards.</p></div>}</>}
      {tab === "plan" && <><div className="g2"><div className="glass stat"><b style={{ color: "#3b82f6" }}>{daysLeft}</b><span className="mu">days to exam</span></div><div className="glass stat"><b style={{ color: "#8b5cf6" }}>{Math.round(s.hrs / 7 * 60)}</b><span className="mu">minutes per day</span></div></div>
        <div className="card glass"><div className="row"><label className="mu">Exam date<br /><input type="date" value={s.exam} onChange={e => setS({ ...s, exam: e.target.value })} /></label>
          <label className="mu">Hours/week<br /><input type="number" min={1} max={40} value={s.hrs} style={{ width: 90 }} onChange={e => setS({ ...s, hrs: +e.target.value || 1 })} /></label></div></div>
        <div className="card glass"><h3>Exam checklist</h3><ul><li>Passing score: 700 on a scale of 1 to 1000.</li><li>Read the official <a href="https://learn.microsoft.com/credentials/certifications/resources/study-guides/az-900" target="_blank" rel="noreferrer">AZ-900 study guide</a>; it links the free practice assessment, exam sandbox and accommodations.</li>
          <li>Reach 80%+ in every domain here, then try the official practice assessment.</li><li>If the exam isn’t offered in your language, you can request an extra 30 minutes.</li></ul></div>
        <div className="card glass">{p.map(d => { const di = CERT.domains.findIndex(x => d.task.startsWith(x.name)); return <div key={d.day} className="tl"><i style={{ background: di < 0 ? "#f59e0b" : DC[di] }} />
          <div><b>{new Date(Date.now() + d.day * day).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}</b><p>{d.task}</p><p className="mu"><Ic n="clock" s={13} /> ~{d.minutes} min</p></div></div>; })}</div></>}
      {tab === "buddy" && <><div className="card glass"><div className="chat">{chat.map((m, i) => <div key={i} className={`m ${m.r}`}>{m.r === "b" && <span className="av"><Ic n="buddy" s={17} /></span>}
        <p>{m.typing ? <span className="ty"><i /><i /><i /></span> : m.t}{m.src?.length ? <span style={{ display: "block", marginTop: 8, fontSize: 12 }}>{m.src.map(x => <a key={x.url} href={x.url} target="_blank" rel="noreferrer" style={{ display: "block" }}>{x.title}</a>)}</span> : null}</p></div>)}</div></div>
        <div className="chips">{offline.slice(0, 16).map(b => <button key={b.title} onClick={() => buddy(b.title)}>{b.title}</button>)}</div>
        {(health.ai || health.ollama) && <select value={persona} onChange={e => setPersona(e.target.value)} aria-label="Persona" style={{ width: "100%", marginBottom: 8 }}>{["a friendly tutor", "a small-shop owner explaining to a customer", "a student talking to a classmate"].map(x => <option key={x}>{x}</option>)}</select>}
        <div className="row"><input placeholder="Ask anything about Azure…" value={ask} onChange={e => setAsk(e.target.value)} onKeyDown={e => e.key === "Enter" && buddy()} style={{ flex: 1, minWidth: 0 }} /><button className="pri" onClick={() => buddy()} aria-label="Send"><Ic n="send" s={18} /></button></div></>}
      {tab === "account" && (user ? <div className="card glass"><h2>Your account</h2><p className="mu">Signed in as {user.email}. Your answers, flashcards and study plan are saved to your account and follow you to any device.</p><button className="btn" onClick={() => supabase?.auth.signOut()}>Sign out</button></div>
        : <form className="card glass" onSubmit={e => { e.preventDefault(); const f = new FormData(e.currentTarget); auth(mode, f.get("email") as string, f.get("password") as string); }}>
          <h2>{mode === "up" ? "Create your account" : "Welcome back"}</h2><p className="mu">Save your progress and use CloudCram on any device.</p>
          {!supabase && <p className="tip glass">Accounts aren’t switched on for this site yet.</p>}
          <input name="email" type="email" required autoComplete="email" placeholder="Email" style={{ width: "100%", marginBottom: 10 }} />
          <input name="password" type="password" required minLength={6} autoComplete={mode === "up" ? "new-password" : "current-password"} placeholder="Password (6+ characters)" style={{ width: "100%", marginBottom: 12 }} />
          <button className="pri" style={{ width: "100%" }}>{mode === "up" ? "Create account" : "Sign in"}</button>
          <p className="mu" style={{ textAlign: "center" }}>{mode === "up" ? "Already have an account? " : "New here? "}<a href="#" onClick={e => { e.preventDefault(); setMode(mode === "up" ? "in" : "up"); }}>{mode === "up" ? "Sign in" : "Create one"}</a></p></form>)}
      {tab === "ready" && <><div className="card glass" style={{ textAlign: "center" }}><Gauge p={ov} /><span className={`vd ${vc}`}>{vt}</span><p>{v.msg}</p></div>
        <div className="grid" style={{ marginBottom: 14 }}>{acc.map(a => <div key={a.id} className="glass stat"><Ring p={Math.round((a.p ?? 0) * 100)} c={DC[a.id]} t={a.p === null ? "–" : undefined} />
          <p style={{ fontSize: 12, fontWeight: 700, margin: "8px 0 2px", lineHeight: 1.25 }}>{a.name}</p><span className="mu" style={{ fontSize: 11 }}>{a.n} answered · {Math.round(a.weight * 100)}% of exam</span></div>)}</div>
        <div className="card glass"><div className="top" style={{ margin: "0 0 8px" }}><b>Question bank explored</b><span className="mu">{seen} / {Qs.length}</span></div><div className="bar"><i style={{ width: `${100 * seen / Qs.length}%`, background: "linear-gradient(90deg,#3b82f6,#8b5cf6)" }} /></div></div>
        <p className="mu">Practice % is not your exam score. The real AZ-900 passing score is 700 on a scale of 1–1000; our 80% rule is a study heuristic.</p>
        {!user && <><div className="card glass row" style={{ justifyContent: "space-between" }}><span className="mu">Sign in to keep your progress on any device.</span><button className="pri" onClick={() => setTab("account")}>Sign in</button></div>
          <button className="btn" onClick={() => { if (confirm("Reset my progress on this device?")) { setS(init()); setQ(null); } }}>Reset my progress</button></>}</>}
    </div>
    <nav className="glass">{tabs.map(([k, l]) => <button key={k} className={tab === k ? "on" : ""} aria-label={l} onClick={() => setTab(k)}><Ic n={k} s={21} />{l}</button>)}</nav>
  </>);
}
