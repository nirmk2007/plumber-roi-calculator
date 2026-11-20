// Saves a lead, then creates the visitor's account on the voice agent and signs them in, so the
// thank-you page can take them straight to the call screen. Runs at POST /api/lead.
//
// The invite code never leaves this function: it is read from an environment variable and sent
// server to server to the voice agent's sign-up. The visitor receives only a session token and the
// random password generated for their new account.
//
// Environment variables (Netlify: Project configuration > Environment variables):
//   INVITE_CODE   required for account creation. Same value as ACCESS_CODE on the voice agent.
//   DEMO_URL      optional. Voice agent base URL; defaults to the live service.
//   SUPABASE_URL  optional. Defaults to this project's URL.
//   SUPABASE_KEY  optional. Publishable (anon) key; defaults to the one in config.js.
import { randomBytes } from "node:crypto";

const DEFAULT_URL = "https://mqtsgxknzgrzhzxwmnpw.supabase.co";
const DEFAULT_KEY = "sb_publishable_KXkk_x5TIEIaB0auOlJ-Rw_bIundvvw";
const DEFAULT_DEMO = "https://plumber-voice-agent-1054654001858.us-central1.run.app";
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const json = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

const text = (v, max) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);

// Create the account and sign it in. Never throws: the lead is already saved, so a failure here
// only means the visitor signs in by hand.
async function createDemoAccount({ name, email, ip }) {
  const code = process.env.INVITE_CODE;
  if (!code) return { account: "unavailable" };
  const base = (process.env.DEMO_URL || DEFAULT_DEMO).replace(/\/$/, "");
  const headers = { "Content-Type": "application/json" };
  if (ip) headers["X-Forwarded-For"] = ip; // so the voice agent's per-IP limit counts the visitor, not Netlify
  const password = randomBytes(18).toString("base64url"); // 24 characters
  try {
    const up = await fetch(`${base}/api/auth/signup`, {
      method: "POST", headers,
      body: JSON.stringify({ email, password, display_name: name.slice(0, 60), invite_code: code }),
    });
    if (!up.ok) {
      const d = await up.json().catch(() => ({}));
      if (up.status === 400 && /already exists/i.test(String(d.detail || ""))) return { account: "exists" };
      return { account: "unavailable" };
    }
    const lg = await fetch(`${base}/api/auth/login`, { method: "POST", headers, body: JSON.stringify({ email, password }) });
    if (!lg.ok) return { account: "created_no_session", password };
    const s = await lg.json();
    return { account: "created", token: s.access_token, password };
  } catch {
    return { account: "unavailable" };
  }
}

export default async (req, context) => {
  if (req.method !== "POST") return json(405, { error: "Use POST." });

  let b;
  try { b = await req.json(); } catch { return json(400, { error: "Bad request." }); }
  if (!b || typeof b !== "object") return json(400, { error: "Bad request." });

  const name = text(b.name, 100);
  const email = text(b.email, 200);
  if (!name) return json(400, { error: "Enter your name." });
  if (!email || !EMAIL.test(email)) return json(400, { error: "Enter a valid email address." });
  if (b.consent !== true) return json(400, { error: "Consent is required." });
  if (b.website) return json(200, { ok: true, account: "unavailable" }); // honeypot filled: act as if fine, store nothing

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

  const ip = (context && context.ip) || req.headers.get("x-nf-client-connection-ip") || "";
  const acct = await createDemoAccount({ name, email: email.toLowerCase(), ip });
  return json(200, { ok: true, ...acct, demo_url: (process.env.DEMO_URL || DEFAULT_DEMO).replace(/\/$/, "") });
};

export const config = { path: "/api/lead" };
