# Missed-call calculator for plumbers

A single-page lead magnet. A plumber enters how many calls they get, how many they miss and what a job is worth, and sees the extra monthly revenue an AI voice agent could capture. Below the result, a form offers a demo invite for the voice agent. Each lead is saved with the numbers they entered.

This project is separate from the voice agent. The only link between them is the demo URL in `config.js`.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | The whole page: calculator, lead form, styling, script. No build step. |
| `config.js` | Settings: Supabase URL and key, demo URL, default numbers. |
| `supabase/leads.sql` | Creates the `roi_leads` table. The public key can only insert rows. |

## How the estimate works

Per week: calls x share missed x share that are real enquiries x share the agent captures x share you book = extra jobs. Extra jobs x average job value x 52/12 = extra revenue per month. Net = revenue minus the agent's monthly cost. Payback days = cost / (revenue per day). All the percentages except "calls you miss" are starting guesses that the visitor can change.

## Set up lead capture (about 10 minutes)

1. Create a **new free Supabase project** for this site (keeps it apart from the voice agent's data).
2. In the SQL editor, run `supabase/leads.sql`.
3. In Project Settings, API, copy the Project URL and the **publishable (anon) key**. Never use the service_role key here.
4. Put them in `config.js` as `SUPABASE_URL` and `SUPABASE_KEY`.
5. Open the page, submit the form, and check the row in Table editor, `roi_leads`.

Leads are readable only in the Supabase dashboard. The public key cannot read, change or delete them. Set `status` by hand (`new`, `contacted`, `invited`, `closed`) as you follow up.

## Publish it

It is static files, so any static host works: Cloudflare Pages, Netlify, GitHub Pages, or a Cloud Storage bucket. Upload the folder (or connect the repo), then share the link. Add your own domain there if you want one.

## Following up on a lead

The form promises an invite code by email. The voice agent's sign-up needs its invite code (`ACCESS_CODE` on the voice agent's Cloud Run service), so send it manually, or reply with a link. Do not publish the code on this page.

## Limits

- The form has a hidden honeypot field and database checks, but no rate limiting. If you see spam, add a captcha or put an Edge Function in front of the insert.
- There are no analytics. Add your own if you want visit and submit counts.
- Email consent text is in the form. Check it against the rules where you send (CAN-SPAM, GDPR).
