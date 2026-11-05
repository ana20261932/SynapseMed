# SynapseMed Commercial Practice Management & Database Architecture

## 1. Overview
SynapseMed is a multi-disciplinary, commercial clinical practice management and real-time medical claims switching platform designed for South African healthcare facilities.

## 2. Live Hosting on Render
- **Service Name**: `synapsemed-za-prod`
- **Service ID**: `srv-dbmaddjm8hqs73f6kr90`
- **Live Production URL**: [https://synapsemed-za-prod.onrender.com](https://synapsemed-za-prod.onrender.com)
- **Git Repository Branch**: `main`
- **Root Directory**: `apps/web`
- **Auto-Deploy**: Enabled on Git commit to `main`
- **Owner**: `tea-dbmab8h5efls73cv6u10` (ana20261923@outlook.com)

## 3. CockroachDB Cloud Integration
The platform uses CockroachDB distributed SQL for zero-downtime, POPIA-compliant multi-tenant persistence.

### Database Credentials & Schema Files:
- Schema Migration DDL: `cockroachdb/schema.sql` (also mirrored at `database/cockroachdb_schema.sql`)
- Seed Data & Credentials: `cockroachdb/seed.sql` (also mirrored at `database/seed_credentials.sql`)

### Applying Migrations to CockroachDB:
```bash
# 1. Connect using CockroachDB CLI or PostgreSQL client:
cockroach sql --url "postgresql://<user>:<password>@<cluster-host>:26257/synapsemed?sslmode=verify-full" -f cockroachdb/schema.sql

# 2. Seed initial practice credentials, staff logins, and medical catalog:
cockroach sql --url "postgresql://<user>:<password>@<cluster-host>:26257/synapsemed?sslmode=verify-full" -f cockroachdb/seed.sql
```

## 4. Pre-configured Clinical Staff Logins & Credentials
All accounts are pre-seeded with default password `SynapseMed2026!` and verified statutory council registration:

| Profession | Full Name | Email Address | Statutory Council & Number | Default Specialty |
|---|---|---|---|---|
| General Practitioner | Dr. Thembeka Mabaso | `dr.mabaso@sandtonmed.co.za` | HPCSA MP0782341 | General Practice / Family Medicine |
| Radiologist | Dr. Kevin Naidoo | `dr.naidoo@sandtonmed.co.za` | HPCSA MP0654921 | Diagnostic Radiology |
| Pharmacist | Pharm. Lerato Dlamini | `l.dlamini@sandtonmed.co.za` | SAPC P48192 | Clinical & Dispensing Pharmacy |
| Lab Technologist | Tech. Sean Venter | `s.venter@sandtonmed.co.za` | HPCSA MT0023812 | Diagnostic Pathology & Haematology |
| Practice Manager | Sr. Michelle Du Plessis | `admin@sandtonmed.co.za` | SANC R18942 / BHF 0428192 | Practice Administration & Billing Switch |

## 5. Commercial Subscription Billing Tiers
- **Solo Specialist Tier**: R1,450 / month (1 Clinician, 200 real-time switch claims, ICD-10 engine)
- **Clinic Pro Tier**: R3,250 / month (Up to 5 Multi-disciplinary Clinicians, 800 claims, NAPPI pharmacy inventory)
- **Enterprise Hospital Tier**: R7,800 / month (Unlimited Clinicians, DICOM PACS, Unlimited Switch, CockroachDB multi-region failover)
- **Per-Claim Switch Tariff**: R3.50 per validated electronic claim submission via Discovery/GEMS/Medscheme

## 6. Production Recommendations
1. **Statutory Council Verification Webhook**: Integrate real-time HPCSA and SAPC registry verification to re-validate practitioner status on monthly renewals.
2. **End-to-End Encryption for Clinical Notes**: Implement client-side envelope encryption for free-text consultation SOAP notes and psychiatric records.
3. **Automated PMB (Prescribed Minimum Benefits) Flagging**: Expand AI diagnostic checks to flag ICD-10 codes that qualify for PMB statutory funding under the Medical Schemes Act.
4. **Offline Resilience & Sync**: Enable local browser IndexedDB caching with CockroachDB multi-master replication to maintain consultation flow during clinic network outages.
