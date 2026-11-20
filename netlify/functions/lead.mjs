// Saves a lead, then hands back the demo invite code. The code lives only in the INVITE_CODE
// environment variable on Netlify, so it is never in the page files: a visitor gets it only after
// their details are stored. Runs at POST /api/lead.
//
// Environment variables (Netlify: Project configuration > Environment variables):
//   INVITE_CODE   required. Same value as ACCESS_CODE on the voice agent's Cloud Run service.
//   SUPABASE_URL  optional. Defaults to this project's URL.
//   SUPABASE_KEY  optional. Publishable (anon) key; defaults to the one in config.js.

const DEFAULT_URL = "https://mqtsgxknzgrzhzxwmnpw.supabase.co";
const DEFAULT_KEY = "sb_publishable_KXkk_x5TIEIaB0auOlJ-Rw_bIundvvw";
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const json = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

const text = (v, max) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);

export default async (req) => {
  if (req.method !== "POST") return json(405, { error: "Use POST." });

  let b;
  try { b = await req.json(); } catch { return json(400, { error: "Bad request." }); }
  if (!b || typeof b !== "object") return json(400, { error: "Bad request." });

  const name = text(b.name, 100);
  const email = text(b.email, 200);
  if (!name) return json(400, { error: "Enter your name." });
  if (!email || !EMAIL.test(email)) return json(400, { error: "Enter a valid email address." });
  if (b.consent !== true) return json(400, { error: "Consent is required." });
  if (b.website) return json(200, { ok: true, code: null }); // honeypot filled: act as if fine, store nothing, give no code

  const row = {
    name, email,
    business: text(b.business, 150),
    phone: text(b.phone, 40),
    consent: true,
    inputs: b.inputs && typeof b.inputs === "object" ? b.inputs : null,
    results: b.results && typeof b.results === "object" ? b.results : null,
    source: text(b.source, 100) || "roi-calculator",
  };

  const base = (process.env.SUPABASE_URL || DEFAULT_URL).replace(/\/$/, "");
  const key = process.env.SUPABASE_KEY || DEFAULT_KEY;
  let res;
  try {
    res = await fetch(`${base}/rest/v1/roi_leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: key, Prefer: "return=minimal" },
      body: JSON.stringify(row),
    });
  } catch {
    return json(502, { error: "Could not save your details. Try again." });
  }
  if (!res.ok) return json(502, { error: "Could not save your details. Try again." });

  // null when INVITE_CODE is not set: the page then falls back to "we will email your code".
  return json(200, { ok: true, code: process.env.INVITE_CODE || null });
};

export const config = { path: "/api/lead" };
