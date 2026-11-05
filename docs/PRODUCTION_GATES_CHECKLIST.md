# Production Gates Checklist — SynapseMed

Production launch is permitted **only** after every gate below has been checked and signed off with supporting evidence. Automated assertions in `productionGates.test.ts` verify code-level gates; the remainder require external evidence.

---

## Legal and compliance

| # | Gate | Status | Evidence required |
|---|------|--------|------------------|
| 1 | Terms of Service (ToS) finalised and reviewed by legal counsel | ☐ | Signed legal review |
| 2 | Data Processing Agreement (DPA) ready for pilot practices to sign | ☐ | Signed DPA template |
| 3 | POPIA Privacy Impact Assessment (PIA) completed and accepted | ☐ | PIA report |
| 4 | Data retention and deletion policy documented and implemented | ☐ | Policy document |
| 5 | Information Officer registered with the Information Regulator (South Africa) | ☐ | Registration confirmation |

## Professional and clinical

| # | Gate | Status | Evidence required |
|---|------|--------|------------------|
| 6 | Clinical workflows reviewed and signed off by a HPCSA-registered practitioner | ☐ | Signed review document |
| 7 | Dental workflows reviewed and signed off by a SADA-registered dentist | ☐ | Signed review document |
| 8 | Pharmacy/prescription workflows reviewed if applicable | ☐ | Signed review or N/A |
| 9 | AI draft-note workflow confirmed not to constitute clinical advice without review | ☐ | Clinical governance sign-off |
| 10 | Transcription consent workflow reviewed for compliance with POPIA Section 11 | ☐ | Legal review |

## Security

| # | Gate | Status | Evidence required |
|---|------|--------|------------------|
| 11 | Penetration test completed by accredited third party | ☐ | Pen test report |
| 12 | All CRITICAL and HIGH findings remediated and re-tested | ☐ | Remediation evidence |
| 13 | TLS 1.2+ enforced on all production endpoints | ☐ | TLS configuration review |
| 14 | Database encrypted at rest | ☐ | Cloud provider encryption config |
| 15 | Object storage encrypted at rest | ☐ | Cloud provider encryption config |
| 16 | JWT_SECRET and all credentials rotated from development defaults | ☐ | Deployment checklist |
| 17 | WAF / DDoS protection configured | ☐ | Infrastructure review |

## Infrastructure and operations

| # | Gate | Status | Evidence required |
|---|------|--------|------------------|
| 18 | Production database is PostgreSQL (not SQLite) | ☐ | DATABASE_URL confirmed |
| 19 | Database backup automated and restore tested (RTO/RPO met) | ☐ | Restore test report |
| 20 | Monitoring and alerting configured (uptime, error rate, latency) | ☐ | Monitoring dashboard |
| 21 | Log aggregation and retention configured | ☐ | Logging config |
| 22 | Incident response playbook tested with tabletop exercise | ☐ | Exercise report |
| 23 | On-call schedule in place | ☐ | Schedule document |

## Provider contracts

| # | Gate | Status | Evidence required |
|---|------|--------|------------------|
| 24 | Payment provider production contract signed | ☐ | Signed contract |
| 25 | ENABLE_REAL_PAYMENTS=true only after gate 24 is signed | ☐ | Deployment config review |
| 26 | Medical-aid switch provider live contract signed | ☐ | Signed contract |
| 27 | ENABLE_REAL_CLAIM_SUBMISSION=true only after gate 26 is signed | ☐ | Deployment config review |
| 28 | Switch sandbox integration tested end-to-end | ☐ | Test report |

## User acceptance

| # | Gate | Status | Evidence required |
|---|------|--------|------------------|
| 29 | UAT completed with at least one pilot practice | ☐ | UAT sign-off document |
| 30 | User documentation published | ☐ | Documentation URL |
| 31 | Support process operational with response SLA defined | ☐ | Support process document |

---

> **This checklist must be reviewed and signed by the product owner, legal counsel, and (for clinical items) a registered healthcare professional before any production traffic is accepted.**
>
> Automated code-level gate assertions are in `src/__tests__/productionGates.test.ts`.
