# Professions, Registration and Specialty Modules

## Onboarding model
Capture the professional discipline, applicable registration council/body, registration number, practice number where relevant, evidence/verification source, status, expiry date if applicable, verifier, timestamp and audit history. Keep registration verification separate from payment-card verification.

Suggested statuses: `not_required`, `unverified`, `pending_review`, `verified`, `rejected`, `expired`, `suspended`, `verification_unavailable`. Confirm which fields and verification pathways apply to each profession; do not assume all disciplines use the same council or identifier.

## Initial profession categories
- Medical practitioners, including general practice and specialists
- Dentists and oral-health professionals
- Radiologists and imaging-centre personnel
- Psychiatrists, psychologists and other mental-health professionals
- Nurses and nursing services
- Pharmacists and pharmacy services
- Physiotherapists
- Occupational therapists
- Optometrists and eye-care professionals
- Audiologists and speech-language therapists
- Dietitians and other allied-health professions
- Laboratories and diagnostic services
- Clinics, hospitals and multidisciplinary organisations

The list is a product-planning starting point, not a definitive legal register. Validate each profession, council and permitted scope of practice with authoritative South African sources and professional advisers.

## Specialty modules
- General practice: encounters, vitals, clinical notes, referrals and follow-ups
- Dentistry: tooth chart, odontogram, dental procedures, treatment plans and dental imaging references
- Radiology: imaging orders, modality/worklist status, report drafts and secure image-system integration points; do not store large DICOM studies in a general document field
- Psychiatry: mental-health notes, treatment plans, review scheduling, consent and restricted-access controls
- Psychology: session notes and treatment plans with enhanced privacy controls
- Physiotherapy/occupational therapy: assessments, care plans, exercise/rehabilitation progress
- Nursing: observations, care plans and follow-up workflows
- Pharmacy: stock, batch/expiry tracking and medication workflows, subject to legal scope
- Laboratory: orders, specimen tracking, results and interfaces
- Hospital/clinic: departments, beds/encounters, referrals and configurable workflows, only as defined in later requirements

## Shared extension contract
Each module declares its permissions, data entities, navigation entries, events, API routes, settings, billing entitlement and compatibility. Module data must inherit practice-level isolation, audit and retention controls. Clinical modules must not broaden a user's access beyond assigned permissions.
