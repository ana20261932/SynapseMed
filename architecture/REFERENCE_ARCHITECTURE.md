# Reference Architecture

## Logical layers
1. Web application: responsive, accessible practice dashboard and patient/admin portals.
2. API layer: authentication, validation, rate limiting, audit and tenant-scoped authorization.
3. Domain services: practice, membership, scheduling, patient administration, clinical notes, billing, inventory, extensions, AI jobs and notifications.
4. Persistence: database selected after checking service fit, quotas and query requirements. Cloudant is document-oriented; relational data may favour PostgreSQL where an eligible/approved service is available. Do not assume a database is a drop-in replacement for another.
5. Integration adapters: payment provider, mock/real switch, FHIR, speech-to-text, messaging, AI model and external catalog.
6. Operations: secrets, logs, monitoring, backups, CI/CD and deployment configuration.

## IBM-oriented initial options to verify
- IBM Cloudant: possible document store for practice configuration and flexible documents.
- IBM App ID or another supported identity service: identity/authentication after checking current account availability and limits.
- IBM Cloud Code Engine: possible container/API hosting, after validating quotas and cost exposure.
- IBM Continuous Delivery / Git integration: repository and pipeline options, after checking current plan and inactivity conditions.
- Watson Speech to Text or other available AI service: optional transcription adapter only after checking present availability, pricing and data-handling terms.

Do not treat this list as confirmation that every service is available in every account/region or remains free. Keep adapters replaceable and document the chosen services.

## Suggested deployment topology
- Frontend static assets or web container
- API container
- Database instance
- Identity provider
- Background worker for reminders/transcription/imports
- Optional object storage for documents, with access control and retention
- Separate external integration credentials and webhook endpoints

## Environment separation
- `local`: synthetic seed data and mock integrations
- `development`: synthetic data, test credentials and mock switch
- `staging`: provider sandbox credentials only, if approved
- `production`: only after security, privacy, legal, clinical and provider readiness gates

## Design rules
- No secrets in source control or frontend bundles.
- Enforce tenant scope at API and database/query boundaries.
- Use an outbox/job pattern for reliable asynchronous tasks where appropriate.
- Make payment webhooks and switch events idempotent.
- Maintain immutable audit events for sensitive actions.
- Use versioned APIs and extension manifests.
