# Security, Privacy and Clinical Safety Baseline

This is an engineering checklist, not a legal opinion or certification.

## Data and privacy
- Design for POPIA and applicable healthcare confidentiality obligations; obtain qualified South African legal/privacy review before production.
- Use synthetic data during development and demos.
- Document purpose, lawful basis/consent where applicable, retention, deletion, access requests, incident response and vendor/subprocessor handling.
- Minimise sensitive data sent to external AI or analytics services.
- Encrypt data in transit and at rest where supported; protect keys and secrets using appropriate secret-management tools.
- Use least privilege, practice-level data isolation, secure session handling and MFA where feasible.
- Log security-relevant events without unnecessarily copying clinical content into logs.
- Define backup, restore, export and disaster-recovery procedures.

## Clinical safety
- AI outputs are suggestions/drafts, not authoritative clinical decisions.
- Require qualified clinician review before signing clinical notes, issuing prescriptions or acting on high-impact suggestions.
- Record the human reviewer and relevant version/audit events.
- Provide correction workflows for transcription and generated summaries.
- Avoid autonomous treatment decisions, prescribing or claim submission.

## Access control
- Authorise every API request server-side.
- Scope every patient, encounter, invoice, attachment and extension resource to the practice and user permissions.
- Test IDOR/BOLA and cross-tenant access explicitly.
- Separate platform support access from clinical access and audit privileged access.

## Payments
- Do not store raw card numbers or CVV.
- Verify webhook signatures, timestamps where supported, event IDs and idempotency.
- Never trust frontend payment-success flags.
- Maintain a reconciliation trail for payment, refund, dispute and subscription state.

## Switch integrations
- Mock by default.
- Keep provider credentials out of source control and client-side code.
- Use official credentials and documented test environments.
- Do not represent mock activity as real claims.

## Production readiness gates
Before real patient use: independent security review, privacy impact assessment, backups/restore test, access-control test suite, incident response plan, vendor review, clinical workflow validation, professional/legal review, payment review and written switch-provider approval where applicable.
