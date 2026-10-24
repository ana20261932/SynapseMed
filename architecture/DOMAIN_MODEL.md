# Initial Domain Model (Draft)

These entities are a starting point. Refine relationships and storage according to the chosen stack.

- `User`: identity reference, status, preferences
- `Organisation`: legal/operating entity and type
- `Practice`: tenant boundary, name, contact details, timezone, configuration
- `PracticeMembership`: user, practice, role, status, permission set
- `ProfessionalProfile`: discipline, council/body, registration number, verification state and audit metadata
- `PracticeNumber`: number type, value, issuer, verification state, practice association
- `Patient`: practice-scoped demographics and identifiers
- `PatientConsent`: purpose, scope, status, timestamp and evidence reference
- `Appointment`: patient, practitioner, location, type, start/end, status, reminders
- `Encounter`: appointment/patient/practitioner, status, clinical date
- `ClinicalNote`: encounter, author, draft/signed status, content reference, review metadata
- `Prescription`: encounter, prescriber, items, status and review/audit data
- `Document`: practice/patient/encounter link, object reference, classification, retention and access policy
- `SpecialtyConfiguration`: practice, specialty, module settings
- `Extension`: publisher, manifest, version, permissions, compatibility and review state
- `PracticeExtensionEntitlement`: practice, extension, plan, activation and expiry
- `SubscriptionPlan`: plan name, version, price, currency, billing period and limits
- `Subscription`: practice, plan, status, provider reference and renewal data
- `PaymentMethodToken`: provider token only, never PAN/CVV
- `PaymentEvent`: provider event ID, verification state, idempotency key, amount and reconciliation state
- `PmsInvoice` / `PmsInvoiceLine`: subscription and add-on charges
- `SwitchProviderConnection`: provider, contract/approval state, credential reference and environment
- `SwitchUsageEvent`: mock/real flag, event type, provider reference, timestamp, status and idempotency key
- `SwitchFeeRule`: contracted source, fee type, effective date and rate
- `SwitchInvoice` / `SwitchInvoiceLine`: separate switch charges
- `InventoryItem`: practice, SKU, stock quantity, threshold, batch/expiry where needed
- `StockMovement`: item, quantity, reason, author and audit metadata
- `AiJob`: provider/model, purpose, input reference, consent/policy state, status and cost/usage metadata
- `AuditEvent`: actor, practice, action, resource, timestamp, result and correlation ID
- `Notification`: recipient, channel, template, consent/dispatch status

## Key invariants
- All practice-owned records carry or resolve to a practice/tenant scope.
- Membership and role are checked for every protected operation.
- Subscription billing records are distinct from switch billing records.
- External provider tokens and credentials are stored securely and never returned to clients.
- AI-generated clinical content has draft status until an authorised clinician reviews/signs it.
