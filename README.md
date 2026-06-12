# CertIQ — AI exemption certificate review with a human in the loop

CertIQ is an AI-native take on one of the most tedious workflows in sales tax compliance:
validating exemption certificates. Companies receive thousands of these documents from
customers; each one has to be checked for completeness, validity, and expiration before
a sale can be treated as tax-exempt. Today that's largely manual review.

CertIQ reimagines the workflow: **the model extracts, the rules decide, the human reviews.**

## What it does

- **AI extraction** — upload a certificate (PDF or image) and Claude extracts nine
  structured fields (purchaser, seller, state, exemption reason, tax ID, signature,
  dates), each with a per-field confidence score.
- **Deterministic policy layer** — a rules engine validates the extraction: expired
  certificates, missing signatures, missing tax IDs, future-dated documents, and
  low-confidence fields all generate issues. AI output is never trusted blindly.
- **Confidence-aware routing** — clean documents are auto-approved and skip the queue;
  anything with an issue is routed to a human reviewer with the problems highlighted.
- **Human-in-the-loop review** — reviewers see extracted values side by side with
  confidence bars, approve or reject with notes (a note is *required* to reject),
  and every action lands in an audit trail.
- **Escalation by design** — the system never auto-rejects. Rejection is always a
  human decision, because a false rejection has customer-facing consequences.

## Product decisions worth noting

1. **Confidence is a first-class UX element.** Per-field confidence bars let a reviewer
   triage in seconds: green fields can be skimmed, red fields demand attention.
2. **Asymmetric automation.** Auto-approve is allowed (low blast radius, reversible);
   auto-reject is not (customer-facing, costly). Automation boundaries should follow
   the cost of being wrong, not just model accuracy.
3. **Mock mode by default.** Without an API key the app runs on realistic sample
   documents, so the workflow can be demoed anywhere. Set `ANTHROPIC_API_KEY` and the
   same UI runs live extraction with Claude.

## Architecture

```
Next.js 14 (App Router, TypeScript)
├── app/page.tsx            — review dashboard (queue, detail pane, stats)
├── app/api/extract/route.ts — extraction endpoint (live Claude or mock)
├── lib/anthropic.ts        — Claude vision extraction w/ structured JSON output
├── lib/validation.ts       — deterministic rules engine + routing decision
└── lib/mock.ts             — sample documents / keyless demo mode
```

## Run it

```bash
npm install
cp .env.example .env.local   # optional: add ANTHROPIC_API_KEY for live extraction
npm run dev                  # http://localhost:3000
```

Deploys directly to Vercel: import the repo, set `ANTHROPIC_API_KEY`, done.

## Roadmap

- Persistence (Postgres) and multi-user roles: preparer vs. approver permissions
- State-specific validation rules (e.g., NY ST-120 vs. TX 01-339 form requirements)
- Bulk intake via email/SFTP and a customer-facing certificate request portal
- Feedback loop: reviewer corrections logged as labeled data for extraction evals
