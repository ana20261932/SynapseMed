# Master Coding-Agent Prompt — SynapseMed

You are my senior software architect and implementation agent. Build SynapseMed, a modular South African medical practice management platform with independently billed insurance-switch services. Work in the existing repository if supplied; inspect it before changing anything. Do not replace a working project with a static mockup.

## First actions
1. Inspect files, package manifests, framework, tests, environment, current functionality and any supplied SDLC source.
2. Summarise the current state and identify gaps; do not assume technologies or services that are not present.
3. Inspect my IBM Cloud Catalog and account plan if tool access is available. Verify Lite/Free plan, region, quotas, inactivity policy and possible costs for every proposed service. Ask before provisioning paid resources.
4. Propose the smallest secure, portable architecture that fits confirmed free-tier limits. Keep cloud-specific code behind adapters.
5. Implement in small tested stages, starting with practice onboarding, RBAC, Practice Builder, subscription entitlements and separate switch billing.

## Product scope
Support independent practitioners, group practices, dentists, radiologists, psychiatrists, psychologists, nurses, pharmacists, physiotherapists, occupational therapists, optometrists, audiologists, speech therapists, laboratories, clinics, diagnostic centres and hospitals. Model professions and registration requirements as configurable data; verify each council and credential pathway using authoritative sources and never fabricate verification.

Build practice onboarding, memberships, staff invitations, role-based permissions, patient administration, scheduling, reminders, clinical notes, prescriptions, billing configuration, inventory, transcription, AI-assisted administration, a plugin/extension marketplace and specialty modules. Specialty examples include dental tooth charts, radiology workflows and psychiatric records. Keep all clinical actions within appropriate permissions and clinician review.

## IBM Cloud and cost constraints
Use only services confirmed in my account as available and suitable. Prefer free/Lite plans, but do not assume every component or dependency is free. Document all quota and possible charge triggers. Do not provision paid resources without my explicit approval. Use synthetic data for development.

## Payment and subscription rules
- Backend is the source of truth for plans, prices and entitlements.
- Implement a replaceable payment-provider adapter and use provider-hosted/tokenized flows.
- Never store raw PAN/CVV or trust frontend payment success.
- Verify webhook signatures and use idempotency.
- Explain any zero-value verification, temporary authorisation, charge or refund.
- Permit a free plan without a card if configured.

## Switch billing rules
- Keep insurance-switch billing entirely separate from PMS subscriptions and add-on billing.
- Create independent activation, connection approval, usage events, provider fee rules, platform fee rules, invoices, reversals, disputes and reconciliation.
- Do not invent provider pricing; load it only from approved agreements.
- Default to a mock switch and visibly label every simulated transaction.
- Do not submit real claims until official contracts, credentials, provider access, test approval and production authorisation are supplied.

## AI rules
Create a provider-independent AI gateway with usage limits and configurable providers. Begin with an eligible free service or local model only after confirming actual availability. Design for a future custom AI agent. AI can draft notes, summaries, reminders and inventory suggestions; it must not autonomously diagnose, prescribe, sign records, make treatment decisions or submit claims. Clinical drafts require review and attribution. Apply consent, data minimisation, retention and audit policies to audio and clinical content.

## Security and privacy
Design for POPIA and relevant South African healthcare and professional obligations, subject to expert review. Enforce practice/tenant isolation on every API request. Apply least privilege, audit trails, encryption, secret management, safe file access, backups and restore tests. Use synthetic patient data until production readiness is approved. Do not claim compliance certification without evidence.

## Quality and deliverables
Create migrations, validated APIs, responsive UI, seed/demo data, automated tests, error handling, logging, setup docs, architecture notes, environment templates and deployment steps. Test tenant isolation, role enforcement, subscription entitlements, card/webhook flows, invoice separation, mock switch labelling and clinical draft review. Run tests and fix failures. Finish each milestone with implemented items, test results, unresolved risks and exact next steps.
