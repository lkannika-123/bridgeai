# Bridge AI

A small-business AI discovery prototype. The core flow is browser-local and has no account dependency in application code.

## Structure

- `src/catalog.mjs`: vendor capability, price and setup data; `null` is an unknown price. Append an entry with the same shape to add a tool.
- `src/matching.mjs`: task resolution, matching, budget/cash arithmetic, handoff descriptions and coach context contract.
- `src/app.mjs`: survey, match cards, comparisons and first-week plans.
- `server/coach.mjs`: optional server-only OpenRouter review and disabled future community collection interface.
- `scripts/build.mjs`: deterministic, dependency-free Worker build. Client assets are embedded from the separate source modules.

Run `npm test` and `npm run build`. Deploy `dist/server/index.js` with `.openai/hosting.json` through Sites.

Optional runtime secrets: `OPENROUTER_API_KEY` and `OPENROUTER_MODEL`. Configure these in Sites, never in browser source. Without a key, `POST /api/coach` responds with `503` and `live:false`; every core feature remains available. `/api/advice` is an alias. Only successful upstream text receives `live:true`.

Coach context version 1 accepts `task`, `description`, `industry`, `business`, `currentProcess`, `existingTools`, `budget`, `baseline`, `selectedTools` and `successMetric`. Owner text is untrusted data. No external request is made until the owner requests a review.

`POST /api/signals` reserves `{optIn:true,industry,task,toolId,stage}`. `stage` must be `added`, `tried` or `kept`. Collection is deliberately disabled: valid requests receive `503` and `recorded:false`. No community claims or counts are displayed. A future collector needs durable storage, explicit consent and aggregation thresholds before activation.

Plans and opt-in interest stay in browser storage. Plan export produces a human-readable checklist plus its structured context. Cross-device saving, sign-in and ongoing coaching are next-phase work.

## Verification

Logic tests cover both judging scenarios, changed-answer outcomes, catalog extension, unclear write-ins, unknown prices, skipped baselines, cash/time separation, AI failures and opt-in lifecycle boundaries. Separate DOM interaction checks cover full survey-to-plan journeys, back navigation, clearing answers, comparisons, missing costs and day-seven stages. Actual phone rendering and real-browser keyboard traversal were unavailable in the build environment; responsive rules and accessible native controls were checked in the DOM.

## Portable GitHub handoff and deployment

Actual framework: vanilla HTML/CSS/ES modules, with a Fetch API Cloudflare Worker backend. No ChatGPT SDK, authentication, connector, database or Sites runtime dependency is required. The `.openai/hosting.json` file identifies the original Sites project only. Keep it when updating that Site; external hosts ignore it. Do not import the original Git remote into a new GitHub repository. The export excludes Git metadata and secret files. Google Fonts load externally with system-font fallbacks.

Prerequisite: Node.js 22 or newer. `npm ci`, `npm test`, `npm run build`, then `node --env-file=.env scripts/local.mjs`. Copy `.env.example` to `.env` first and set values privately. Local URL: http://localhost:3000. With no key the app works and the coach returns 503.

Cloudflare Workers (external deployment, run yourself):

```sh
npm ci
npm test
npm run build
npx wrangler@4 login
npx wrangler@4 secret put OPENROUTER_API_KEY
npx wrangler@4 deploy
```

Enter the key only at Wrangler's hidden secret prompt. `wrangler.jsonc` sets OPENROUTER_MODEL; change that nonsecret model ID if needed. The generated Worker embeds all frontend assets. The deploy command prints a workers.dev demo URL; no purchased domain is necessary. The configured Cloudflare rate-limit binding adds platform enforcement, with the local limiter as a fallback. Cloudflare limits are location-scoped, not an account-wide billing cap; set spending limits with OpenRouter too.

Vercel: import the new private GitHub repository, choose Other framework, Node 22+, build command `node scripts/vercel-build.mjs`, output directory `public`. `api/coach.js` is the Node serverless adapter. In Project Settings → Environment Variables add OPENROUTER_API_KEY as a sensitive value for Production (and Preview only if wanted), and OPENROUTER_MODEL as the model ID. Deploy/redeploy after setting them. Vercel supplies the vercel.app demo URL. The coach limiter on Vercel is in-memory per warm instance: for a publicly promoted demo add a Vercel Firewall rate-limit rule for POST /api/coach (5 requests/minute/client) or a shared rate-limit service. Instance memory alone is not a distributed quota. No keys belong in VITE_ or NEXT_PUBLIC_ variables.

New GitHub repository commands, run from the extracted directory (replace YOUR_ORG/YOUR_REPO with your private repository):

```sh
git init -b main
git add .
git commit -m "Bridge AI decision, budget comparison and OpenRouter coach"
git remote add origin https://github.com/YOUR_ORG/YOUR_REPO.git
git push -u origin main
```

### Live coach verification after secret entry

The real OpenRouter call is PENDING until you set the key. Complete the survey, compare tools, add to My plan, choose an option or save a shortlist, and save the decision. Refresh and verify the same budget and decision appear. Click Open AI Coach: it should show loading, then LIVE AI REVIEW with useful advice. In browser developer tools, requests go only to /api/coach; the key must not appear in requests, responses or frontend assets. The server-to-provider Authorization header is server-only. Remove the secret and redeploy to confirm the unavailable state while the checklist remains usable. Restore it and redeploy. Use browser Print → Save as PDF on the final plan.

The coach caps request size, task/metric length and response length, times out provider requests and never logs keys or provider responses. Future community collection remains disabled. Browser storage is device/browser-specific; clearing browser data removes saved plans. Prices and one-time charges not confirmed by vendors remain unknown, not zero. Budget fit covers monthly cost only; verify one-time charges separately before purchasing.
