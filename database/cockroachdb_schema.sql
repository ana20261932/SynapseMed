-- ============================================================================
-- SynapseMed CockroachDB Production Schema
-- Distributed Multi-Tenant Healthcare Practice Management System
-- South Africa (POPIA & HPCSA Statutory Compliant)
-- ============================================================================

CREATE DATABASE IF NOT EXISTS synapsemed;
USE synapsemed;

-- 1. Identity, Credentials & Login Authentication
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email STRING UNIQUE NOT NULL,
    password_hash STRING NOT NULL,
    first_name STRING NOT NULL,
    last_name STRING NOT NULL,
    phone STRING,
    role STRING NOT NULL, -- 'doctor', 'radiologist', 'pharmacist', 'lab_tech', 'admin'
    council_discipline STRING NOT NULL, -- 'Medical Practitioner', 'Radiologist', 'Pharmacist', 'Medical Technologist'
    council_registration_number STRING NOT NULL, -- e.g. 'MP0782341', 'P48192'
    council_verification_status STRING NOT NULL DEFAULT 'verified',
    mfa_enabled BOOLEAN NOT NULL DEFAULT true,
    mfa_secret STRING,
    status STRING NOT NULL DEFAULT 'active',
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- 2. Medical Practice Tenant Boundary
CREATE TABLE IF NOT EXISTS practices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bhf_practice_number STRING UNIQUE NOT NULL, -- 7-digit Board of Healthcare Funders ID
    name STRING NOT NULL,
    organisation_type STRING NOT NULL DEFAULT 'multidisciplinary_clinic',
    vat_number STRING,
    country_code STRING NOT NULL DEFAULT 'ZA',
    currency STRING NOT NULL DEFAULT 'ZAR',
    timezone STRING NOT NULL DEFAULT 'Africa/Johannesburg',
    subscription_tier STRING NOT NULL DEFAULT 'enterprise',
    monthly_fee_zar DECIMAL(10,2) NOT NULL DEFAULT 7800.00,
    switch_fee_per_claim_zar DECIMAL(10,2) NOT NULL DEFAULT 3.50,
    status STRING NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- 3. Practice Memberships & Access Roles
CREATE TABLE IF NOT EXISTS practice_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
    role STRING NOT NULL,
    permissions JSONB NOT NULL DEFAULT '["encounters:read", "encounters:write", "switch:submit"]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    UNIQUE (user_id, practice_id)
);

-- 4. Patients Registry
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
    id_number STRING NOT NULL, -- 13 digit South African National ID
    full_name STRING NOT NULL,
    date_of_birth DATE NOT NULL,
    gender STRING NOT NULL,
    phone STRING,
    email STRING,
    address STRING,
    medical_aid_scheme STRING,
    membership_number STRING,
    dependant_code STRING NOT NULL DEFAULT '00',
    plan_name STRING,
    allergies JSONB DEFAULT '[]',
    chronic_conditions JSONB DEFAULT '[]',
    status STRING NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- 5. Clinical Encounters (Clinical Canvas & AI Insights)
CREATE TABLE IF NOT EXISTS clinical_encounters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    clinician_id UUID NOT NULL REFERENCES users(id),
    specialty STRING NOT NULL DEFAULT 'General Practice',
    chief_complaint STRING NOT NULL,
    history_of_illness STRING,
    vitals JSONB NOT NULL,
    examination STRING,
    assessment STRING,
    plan STRING,
    medicines STRING,
    allergies STRING,
    referrals STRING,
    follow_up STRING,
    icd10_codes JSONB DEFAULT '[]',
    nappi_codes JSONB DEFAULT '[]',
    status STRING NOT NULL DEFAULT 'draft',
    signed_by STRING,
    signed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- 6. Pharmacy Inventory & NAPPI Registry
CREATE TABLE IF NOT EXISTS pharmacy_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
    sku STRING NOT NULL,
    name STRING NOT NULL,
    generic_name STRING NOT NULL,
    nappi_code STRING NOT NULL,
    strength STRING NOT NULL,
    schedule STRING NOT NULL, -- 'S0', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6'
    unit STRING NOT NULL,
    stock_quantity INT NOT NULL DEFAULT 0,
    low_stock_threshold INT NOT NULL DEFAULT 10,
    price_zar DECIMAL(10,2) NOT NULL,
    batch_number STRING NOT NULL,
    expiry_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- 7. Medical-Aid Claims Switch Submissions
CREATE TABLE IF NOT EXISTS switch_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    claim_number STRING UNIQUE NOT NULL,
    scheme_code STRING NOT NULL,
    scheme_name STRING NOT NULL,
    membership_number STRING NOT NULL,
    dependant_code STRING NOT NULL DEFAULT '00',
    icd10_primary STRING NOT NULL,
    tariff_codes JSONB NOT NULL DEFAULT '[]',
    total_claimed_zar DECIMAL(10,2) NOT NULL,
    scheme_paid_zar DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    patient_copay_zar DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status STRING NOT NULL DEFAULT 'submitted',
    switch_response_code STRING,
    switch_response_message STRING,
    is_simulated BOOLEAN NOT NULL DEFAULT true,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- 8. Statutory Audit Log (POPIA compliance)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    practice_id UUID REFERENCES practices(id),
    user_id UUID REFERENCES users(id),
    action STRING NOT NULL,
    entity_type STRING NOT NULL,
    entity_id STRING,
    metadata JSONB,
    ip_address STRING,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);
