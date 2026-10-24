# Product Requirements — SynapseMed

## 1. Vision
Create a modular South African healthcare practice management platform that can be configured by independent practitioners, multidisciplinary practices, clinics, diagnostic facilities and hospitals. Practices should choose only the capabilities they need, then add more through a controlled extension marketplace.

## 2. Target users
- Independent and freelance practitioners
- Single-practitioner and group practices
- Multidisciplinary clinics
- Dental practices
- Radiology and imaging centres
- Psychiatric and mental-health practices
- Nursing and allied-health practices
- Pharmacies, laboratories, clinics and hospitals, subject to scoped workflows
- Practice administrators, receptionists, billing staff, clinicians, stock managers and organisation owners

## 3. Core product areas
1. Identity, organisations, practices and memberships
2. Professional onboarding and registration-status tracking
3. Configurable Practice Builder and module entitlements
4. Patient demographics and administrative records
5. Appointment scheduling, reminders and task management
6. Clinical notes and document management
7. Prescriptions and medication workflows, with clinician oversight
8. South African billing configuration and coding support
9. Mock insurance-switch adapter and separate switch billing
10. Payment-provider integration for subscriptions and card verification
11. Extension marketplace, SDK, versioning and permissions
12. AI Automation Centre with provider-independent gateway
13. Inventory, low-stock alerts and reorder suggestions
14. Transcription and draft note creation
15. Reporting, audit trails, backups and administration

## 4. Practice Builder flow
1. Create account and verify contact details.
2. Create a practice or accept an invitation to an existing practice.
3. Choose organisation type: independent practitioner, group practice, clinic, imaging centre, laboratory or hospital.
4. Select professional discipline and specialties.
5. Capture council, registration number, practice number and relevant credentials where applicable.
6. Record verification status as `unverified`, `pending`, `verified`, `rejected` or `expired`; never infer verification.
7. Choose required modules and optional extensions.
8. Select a plan and review separate subscription and switch charges.
9. Complete any required payment-card verification through a supported provider flow.
10. Configure roles, invite team members and complete a guided setup checklist.

## 5. Multi-practice access
A user can belong to multiple practices, with a separate role and permissions for each membership. Enforce tenant/practice isolation on the server for every data request. Never rely on hiding UI elements as the only access control.

## 6. Subscription and entitlements
- Keep plans, module entitlements, billing status and usage limits configurable in the backend.
- The frontend may display illustrative prices but must fetch actual current pricing from the backend.
- Prevent access to paid features when an entitlement is inactive, except for explicitly configured grace periods.
- Provide clear invoices, plan changes, cancellation and payment status.
- Support free plans without a payment card if the product owner chooses that policy.

## 7. Separate insurance-switch billing
- PMS subscription and switch service must be independently selectable and billed.
- A user must be able to buy core PMS capabilities without switch access.
- Track switch activation, provider, contract/credential status, transaction usage, provider pass-through fees, platform fees, reversals, disputes, reconciliation and invoices separately.
- Do not invent third-party rates; configure them only from authorised agreements.
- Development defaults to a mock switch. Clearly label simulated transactions.

## 8. AI features
- Admin automation: document classification, reminders, task suggestions and administrative summaries.
- Clinical assistance: draft summaries and note suggestions only, with clinician review and attribution.
- Transcription: consent-aware capture, secure processing, retention controls and deletion workflow.
- Inventory: forecast/reorder suggestions with explainable thresholds; no automatic purchase without configured authorisation.
- Patient reminders: configurable channels, opt-in/consent and minimal sensitive content.
- Provide a provider gateway supporting local or eligible free services at first and a future custom agent later.
- Never allow an AI agent to autonomously make a diagnosis, issue a prescription, submit a claim or alter a medical record without appropriate approval and audit logging.

## 9. Extension marketplace
- Extension manifest: ID, version, publisher, compatibility, permissions, requested data access, price, billing model and installation instructions.
- Review, signing/version integrity, sandboxing, dependency checks, audit trail and uninstall/rollback.
- Extensions cannot bypass tenant isolation or role permissions.
- Billing and entitlements must be enforced server-side.

## 10. Minimum acceptance criteria
- A practice can be created and configured with a chosen specialty.
- A practitioner can have a registration status that is explicitly tracked.
- A user can belong to two practices with different roles and isolated data.
- A practice can enable/disable a module and the backend enforces entitlement.
- PMS invoice and switch usage invoice are distinct records.
- Mock claims are unmistakably labelled and never represented as real submissions.
- Payment webhooks are signature-verified and idempotent.
- No raw card number or CVV is persisted.
- AI-generated clinical content is marked as a draft and requires clinician review.
- Automated tests cover authentication, access control, billing separation and tenant isolation.
