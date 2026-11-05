# Master Build Prompt — SynapseMed + Kilo CLI

You are the Lead Agent orchestrating the SynapseMed platform build using Kilo CLI.
Read the context from docs/PRODUCT_REQUIREMENTS.md, architecture/REFERENCE_ARCHITECTURE.md, and planning/IMPLEMENTATION_ROADMAP.md.

## Execution Steps

1. Review the monorepo structure in package.json.
2. Confirm modular boundaries between apps/api (backend PMS services) and apps/web (frontend interface).
3. Implement Milestone 1 from the roadmap safely using mock adapters for the South African medical insurance-switch layer.
4. Run tests using `npm run test:api` to verify functionality.

## UI Requirements

- Build the frontend UI following the Preclinic Free Medical & Clinic Management Dashboard Figma UI Kit design language.
- Make the UI profession-specific: each medical profession user (doctor, dentist, radiologist, psychiatrist, psychologist, nurse, pharmacist, physiotherapist, occupational therapist, optometrist, audiologist, speech therapist, dietitian, laboratory, clinic, hospital) sees a tailored dashboard and workflow matching their specialty module.
- Use Tailwind CSS with a medical color palette (teal, blue-grey, clean whites).
- Responsive sidebar navigation, header with practice switcher, cards, badges, buttons, tables, forms.

## Compliance & Security

Maintain strict POPIA compliance, data encryption practices, and separate billing ledgers at all times.
- PMS subscription ledger and insurance-switch transaction usage must remain completely decoupled.
- No hardcoded secrets; no raw card numbers/CVV storage.
- AI clinical outputs flagged for human clinician review.
- Practice/tenant isolation enforced on every API request.

## Launch

- `kilo --prompt "Load @compliance-officer and review our initial backend schemas for POPIA data minimization compliance."`
- `npm run test:api` to verify API functionality.
