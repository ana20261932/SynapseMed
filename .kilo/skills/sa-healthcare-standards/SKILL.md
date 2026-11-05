---
name: sa-healthcare-standards
description: Enforces South African healthcare billing, switch separation, and secure medical data handling.
---
# Rules for SynapseMed Development:

1. **Mock Switch First**: Do not attempt live switch connections; use mock adapters as defined in product requirements. All simulated transactions must be visibly labelled.
2. **Dual-Ledger Separation**: PMS subscription fees must be billed separately from electronic switch claims usage. Independent entitlements, ledgers, and invoices.
3. **Clinical Safety**: AI clinical outputs and notes must always be flagged for human clinician review. Draft status until an authorised clinician reviews and signs.
4. **POPIA Compliance**: Enforce protection of personal information; data minimization, consent-aware capture, retention controls, and deletion workflows.
5. **HPCSA Guidelines**: Align with Health Professions Council of South Africa professional obligations for each medical discipline.
6. **Tenant Isolation**: Enforce practice/tenant scope on every API request. Never rely on hiding UI elements as the only access control.
7. **No Raw Card Data**: Never store raw PAN/CVV. Use payment provider tokens only.
8. **Registration Verification**: Track professional registration status explicitly (`unverified`, `pending`, `verified`, `rejected`, `expired`, `suspended`); never infer verification.
9. **Audit Trail**: Maintain immutable audit events for all sensitive clinical, billing, and membership actions.
10. **Synthetic Data**: Use synthetic/demo data in development; no real patient data until security and regulatory review.
