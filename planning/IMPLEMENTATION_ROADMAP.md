# Implementation Roadmap

Use the original source document's 26-week SDLC concept as a planning reference, but re-estimate dates after repository and IBM Catalog inspection. Do not treat this sequence as a guaranteed delivery estimate.

## Milestone 0 — Environment and decisions
- Inspect available IBM catalog tools and account plan.
- Select frontend/backend stack, database, identity, deployment and source-control path.
- Record service limits, cost exposure and portability plan.
- Create repo, environment templates, coding standards and CI checks.

## Milestone 1 — Foundation
- Authentication and secure session handling.
- Organisation, practice, memberships and tenant-scoped RBAC.
- Professional profile and registration verification status.
- Practice Builder and feature/module entitlements.
- Synthetic seed data and audit events.

## Milestone 2 — Plans and payment adapter
- Backend-configured plan catalogue.
- Subscription lifecycle and invoices.
- Payment-provider adapter and sandbox integration.
- Card verification/tokenization and signed webhook handling.
- Tests for webhook replay, payment state transitions and no-card free plan policy.

## Milestone 3 — Separate switch billing
- Mock switch adapter and clearly labelled simulated claims.
- Independent switch activation, usage ledger, fee rules, invoice and reconciliation.
- Provider-connection status and credential handling.
- Tests proving PMS can operate without switch activation and invoices remain separate.

## Milestone 4 — Core practice workflows
- Patient registration, scheduling, tasks, reminders and document management.
- Clinical notes and encounter workflow with draft/signed states.
- Basic billing/coding configuration and import/export.

## Milestone 5 — Specialty extensions
- Dental odontogram and treatment plan.
- Radiology order/report workflow and image-system integration boundary.
- Psychiatry/mental-health records with enhanced access controls.
- Allied-health and clinic workflows based on validated requirements.

## Milestone 6 — AI Automation Centre
- Provider-independent gateway and usage limits.
- Admin assistance, transcription drafts, reminders and inventory suggestions.
- Consent, redaction/minimisation, review and audit workflows.
- Future custom agent adapter; no autonomous clinical action.

## Milestone 7 — Extension marketplace
- Extension manifest, publisher, review, compatibility and permissions.
- Installation, enable/disable, billing entitlement, versioning and rollback.
- Sandboxing and security tests.

## Milestone 8 — Pilot readiness
- Security and privacy review, backup/restore test, load/error tests.
- Clinical workflow review and user acceptance testing.
- Payment-provider and switch-provider sandbox/contract approvals.
- User documentation, support process and incident response.

## Milestone 9 — Production gates
Production launch only after relevant legal, privacy, professional, security, clinical and provider requirements have been checked and signed off. Do not claim certification or live switch connectivity before evidence exists.
