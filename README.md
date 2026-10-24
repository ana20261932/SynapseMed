# SynapseMed

**South African modular medical practice management (PMS), clinical workflow and billing-switch platform — project starter pack**

This ZIP consolidates the project scope and implementation guidance developed in this conversation. It is a specification and development starter pack, **not a completed or production-ready medical application**.

## Start here

1. Read `docs/PRODUCT_REQUIREMENTS.md` for the product scope.
2. Read `architecture/REFERENCE_ARCHITECTURE.md` for the proposed technical architecture.
3. Open `prompts/MASTER_BUILD_PROMPT.md` in the coding agent or development tool you choose.
4. Review `planning/IBM_CLOUD_FREE_TIER_CHECKLIST.md` against the current services, regions, quotas and pricing visible in your IBM Cloud account before provisioning anything.
5. Follow `planning/IMPLEMENTATION_ROADMAP.md` and implement one tested milestone at a time.

## Project principles

- Target South African practices and applicable healthcare, privacy and professional obligations.
- Start with synthetic/demo data; do not use real patient data until security, privacy, contracts and operational readiness are reviewed.
- Build the insurance-switch integration as a mock adapter first. Real submissions require authorised provider access, credentials, contracts and approval.
- Bill the PMS subscription and insurance-switch usage separately, with independent entitlements, ledgers and invoices.
- Never store raw card numbers or CVV. Use a payment provider's hosted/tokenised flow and verified webhooks.
- AI output for clinical records, prescriptions and decisions must be reviewed by an appropriately qualified clinician.
- Do not assume IBM Catalog presence means a service is free. Verify plan, region, quota, inactivity rules and possible charges in the account.

## Contents

- `docs/PRODUCT_REQUIREMENTS.md` — product vision, personas, scope and acceptance criteria
- `docs/PROFESSIONALS_AND_SPECIALTIES.md` — professions, specialty modules and registration workflow
- `docs/BILLING_AND_PRICING.md` — indicative subscription model and separately billed switch model
- `docs/SECURITY_PRIVACY_AND_SAFETY.md` — baseline safeguards and compliance workstream
- `docs/SDLC_SOURCE_NOTES.md` — summary of the original uploaded SDLC blueprint
- `docs/medical-pms-billing-switch-sdlc-source.pdf` — original uploaded PDF
- `architecture/REFERENCE_ARCHITECTURE.md` — IBM-oriented, provider-independent architecture
- `architecture/DOMAIN_MODEL.md` — suggested initial entities and relationships
- `planning/IBM_CLOUD_FREE_TIER_CHECKLIST.md` — service verification checklist
- `planning/IMPLEMENTATION_ROADMAP.md` — staged delivery plan
- `prompts/MASTER_BUILD_PROMPT.md` — master coding-agent prompt
- `prompts/IBM_CLOUD_CATALOG_SETUP_PROMPT.md` — IBM catalog-first setup prompt
- `config/.env.example` — safe example environment variables; no secrets

## Status

Current status: **planning/specification starter pack**. No cloud resources have been provisioned, no switch provider has been connected, no payment integration has been activated, and no clinical or regulatory certification is claimed.
