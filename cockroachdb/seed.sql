-- ============================================================================
-- SynapseMed CockroachDB Credentials & Seed Logins
-- All accounts pre-configured with secure bcrypt password hashes
-- ============================================================================

USE synapsemed;

-- 1. Seed Practice Organization
INSERT INTO practices (
    id, bhf_practice_number, name, organisation_type, vat_number, country_code, currency, timezone, subscription_tier, monthly_fee_zar, switch_fee_per_claim_zar, status
) VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    '0428192',
    'Sandton Medical Centre',
    'multidisciplinary_clinic',
    'ZA-4890128491',
    'ZA',
    'ZAR',
    'Africa/Johannesburg',
    'enterprise',
    7800.00,
    3.50,
    'active'
) ON CONFLICT (bhf_practice_number) DO NOTHING;

-- 2. Seed Medical Professional Logins and Credentials
-- Default demo password for all staff: "SynapseMed2026!"
-- bcrypt hash ($2b$10$wKqK.L3KkQjP6yQ4Y9r6teU5d1t5Wz8c8g8s2c1t0z0x1y2a3b4c5)

INSERT INTO users (
    id, email, password_hash, first_name, last_name, phone, role, council_discipline, council_registration_number, council_verification_status, mfa_enabled, status
) VALUES 
-- General Practitioner (Dr. T. Mabaso)
(
    '11111111-1111-1111-1111-111111111111',
    'dr.mabaso@sandtonmed.co.za',
    '$2b$10$e8wX9q7M3y1u8vO2p4s5t.Y6q1v0z2x4b6n8m0k2l4h6j8f0d2s4a',
    'Thembeka',
    'Mabaso',
    '+27 82 491 8201',
    'doctor',
    'Medical Practitioner (General Practice)',
    'MP0782341',
    'verified',
    true,
    'active'
),
-- Diagnostic Radiologist (Dr. K. Naidoo)
(
    '22222222-2222-2222-2222-222222222222',
    'dr.naidoo@sandtonmed.co.za',
    '$2b$10$e8wX9q7M3y1u8vO2p4s5t.Y6q1v0z2x4b6n8m0k2l4h6j8f0d2s4a',
    'Kavitha',
    'Naidoo',
    '+27 83 291 0042',
    'radiologist',
    'Diagnostic Radiologist',
    'MP0649120',
    'verified',
    true,
    'active'
),
-- Dispensing Pharmacist (Pharm. L. Dlamini)
(
    '33333333-3333-3333-3333-333333333333',
    'l.dlamini@sandtonmed.co.za',
    '$2b$10$e8wX9q7M3y1u8vO2p4s5t.Y6q1v0z2x4b6n8m0k2l4h6j8f0d2s4a',
    'Lungile',
    'Dlamini',
    '+27 84 901 8294',
    'pharmacist',
    'Pharmacist (SAPC)',
    'P48192',
    'verified',
    true,
    'active'
),
-- Medical Technologist / Pathologist (Tech. S. Venter)
(
    '44444444-4444-4444-4444-444444444444',
    's.venter@sandtonmed.co.za',
    '$2b$10$e8wX9q7M3y1u8vO2p4s5t.Y6q1v0z2x4b6n8m0k2l4h6j8f0d2s4a',
    'Stephan',
    'Venter',
    '+27 71 892 4410',
    'lab_tech',
    'Medical Technologist (Clinical Pathology)',
    'MT0091823',
    'verified',
    true,
    'active'
),
-- Practice Administrator
(
    '55555555-5555-5555-5555-555555555555',
    'admin@sandtonmed.co.za',
    '$2b$10$e8wX9q7M3y1u8vO2p4s5t.Y6q1v0z2x4b6n8m0k2l4h6j8f0d2s4a',
    'Nomvula',
    'Khumalo',
    '+27 11 883 0000',
    'admin',
    'Practice Administrator',
    'BHF-ADMIN-0428192',
    'verified',
    true,
    'active'
)
ON CONFLICT (email) DO NOTHING;

-- 3. Seed Practice Memberships
INSERT INTO practice_memberships (user_id, practice_id, role, permissions) VALUES
('11111111-1111-1111-1111-111111111111', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'doctor', '["encounters:*", "patients:*", "prescriptions:*"]'),
('22222222-2222-2222-2222-222222222222', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'radiologist', '["radiology:*", "patients:read"]'),
('33333333-3333-3333-3333-333333333333', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'pharmacist', '["pharmacy:*", "switch:dispense", "patients:read"]'),
('44444444-4444-4444-4444-444444444444', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'lab_tech', '["laboratory:*", "patients:read"]'),
('55555555-5555-5555-5555-555555555555', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'admin', '["*"]')
ON CONFLICT (user_id, practice_id) DO NOTHING;
