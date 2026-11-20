// Settings for the calculator page. None of these are secrets.
// The Supabase publishable (anon) key is safe to publish because the table only allows inserts
// (see supabase/leads.sql). Never put a service_role key here.
window.CALC_CONFIG = {
  // Supabase project URL and publishable key (Project Settings, API). Leave empty until set up;
  // the form then tells the visitor it is not connected yet.
  SUPABASE_URL: "https://mqtsgxknzgrzhzxwmnpw.supabase.co",
  SUPABASE_KEY: "sb_publishable_KXkk_x5TIEIaB0auOlJ-Rw_bIundvvw",

  // The voice agent demo people are invited to try.
  DEMO_URL: "https://plumber-voice-agent-1054654001858.us-central1.run.app",

  // Shown in the page header and stored with each lead so you know which link they came from.
  BRAND: "AI voice agent for plumbers",
  SOURCE: "roi-calculator",

  // Defaults the calculator opens with.
  DEFAULTS: { calls: 40, missed: 25, job: 350, real: 60, pickup: 80, book: 40, cost: 199 }
};
