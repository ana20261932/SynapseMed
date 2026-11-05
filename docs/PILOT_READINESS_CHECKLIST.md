# Pilot Readiness Checklist — SynapseMed

This document records items that must be verified before the pilot launch. Automated tests in `pilotReadiness.test.ts` cover structural checks. Items below require manual verification and sign-off.

---

## Security and privacy

| # | Item | Status | Evidence / Notes |
|---|------|--------|-----------------|
| 1 | Penetration test conducted by qualified third party | ☐ Pending | — |
| 2 | All HIGH/CRITICAL findings from pen test remediated | ☐ Pending | — |
| 3 | POPIA Privacy Impact Assessment completed | ☐ Pending | — |
| 4 | Data-at-rest encryption confirmed for database and object storage | ☐ Pending | — |
| 5 | Data-in-transit TLS 1.2+ confirmed for all endpoints | ☐ Pending | — |
| 6 | Secret rotation: JWT_SECRET, payment keys, switch credentials | ☐ Pending | — |
| 7 | Database uses PostgreSQL (not SQLite) in staging/production | ☐ Pending | — |

## Backup and restore

| # | Item | Status | Evidence / Notes |
|---|------|--------|-----------------|
| 8 | Automated database backup configured and tested | ☐ Pending | — |
| 9 | Restore test completed — RTO and RPO targets met | ☐ Pending | — |
| 10 | Object storage backup policy in place | ☐ Pending | — |

## Clinical workflow review

| # | Item | Status | Evidence / Notes |
|---|------|--------|-----------------|
| 11 | End-to-end patient registration → encounter → note → sign reviewed by a registered practitioner | ☐ Pending | — |
| 12 | Prescription workflow reviewed by a registered prescriber | ☐ Pending | — |
| 13 | Billing/coding configuration reviewed for SA tariff compliance | ☐ Pending | — |
| 14 | Dental odontogram reviewed by a registered dentist | ☐ Pending | — |
| 15 | Mental health access controls reviewed by a registered psychiatrist | ☐ Pending | — |

## User acceptance testing

| # | Item | Status | Evidence / Notes |
|---|------|--------|-----------------|
| 16 | UAT completed with pilot practice owners | ☐ Pending | — |
| 17 | UAT completed with receptionists and billing staff | ☐ Pending | — |
| 18 | Accessibility review (WCAG 2.1 AA) completed for web UI | ☐ Pending | — |

## Provider approvals

| # | Item | Status | Evidence / Notes |
|---|------|--------|-----------------|
| 19 | Payment provider sandbox testing complete | ☐ Pending | — |
| 20 | Payment provider production contract signed | ☐ Pending | — |
| 21 | Switch provider sandbox testing complete | ☐ Pending | — |
| 22 | Switch provider live contract signed (required before ENABLE_REAL_CLAIM_SUBMISSION=true) | ☐ Pending | — |

## Operations

| # | Item | Status | Evidence / Notes |
|---|------|--------|-----------------|
| 23 | User documentation drafted and reviewed | ☐ Pending | — |
| 24 | Support process and escalation path defined | ☐ Pending | — |
| 25 | Incident response playbook finalised | ☐ Pending | — |
| 26 | On-call schedule and runbook in place | ☐ Pending | — |

---

> **Do not launch the pilot until all items above are marked complete with supporting evidence.**
