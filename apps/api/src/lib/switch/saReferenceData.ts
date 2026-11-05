/**
 * SA Medical Switch — Reference data
 *
 * Contains realistic South African healthcare reference data used by the
 * mock adjudication engine. In production this would come from:
 *  - ICD-10: WHO / HPCSA ICD-10-CM coded reference
 *  - NAPPI: National Pharmaceutical Product Interface (NAPPI code registry)
 *  - Tariffs: SAMA/NHRPL fee schedule (negotiated per scheme)
 *  - Schemes: Council for Medical Schemes registered schemes
 *  - RA codes: BHF Remittance Advice reason codes
 */

// ── Medical aid schemes (CMS-registered) ─────────────────────────────────────
export const SA_SCHEMES: Record<string, { name: string; adminBy: string; planTypes: string[] }> = {
  DISC: { name: 'Discovery Health Medical Scheme', adminBy: 'Discovery Health', planTypes: ['KeyCare', 'Essential', 'Classic', 'Comprehensive', 'Executive'] },
  GEMS: { name: 'Government Employees Medical Scheme', adminBy: 'GEMS', planTypes: ['Sapphire', 'Beryl', 'Ruby', 'Emerald', 'Onyx', 'Diamond'] },
  MEDI: { name: 'Medihelp Medical Scheme', adminBy: 'Medihelp', planTypes: ['Prime', 'Dimension', 'Necesse', 'Xtend'] },
  BHF:  { name: 'Bonitas Medical Fund', adminBy: 'Bonitas', planTypes: ['BonStart', 'BonEssential', 'BonClassic', 'BonComplete', 'BonFit'] },
  FEDI: { name: 'Fedhealth Medical Scheme', adminBy: 'Fedhealth', planTypes: ['flex', 'flexPlus', 'maxima', 'maximaPlus', 'Dimension'] },
  MOME: { name: 'Momentum Health', adminBy: 'Momentum', planTypes: ['Ingwe', 'Incentive', 'Summit', 'Extravaganza', 'Custom'] },
  RESS: { name: 'Resolution Health Medical Scheme', adminBy: 'Resolution Health', planTypes: ['Essential', 'Plus', 'Premier'] },
  PROF: { name: 'Profmed', adminBy: 'Profmed', planTypes: ['Pace', 'ProAct', 'ProActive', 'Savvy'] },
};

// ── ICD-10 codes (common in SA private practice) ──────────────────────────────
export const ICD10_CODES: Record<string, { description: string; category: string }> = {
  'J06.9':  { description: 'Acute upper respiratory infection, unspecified', category: 'Respiratory' },
  'J11.1':  { description: 'Influenza with other respiratory manifestations', category: 'Respiratory' },
  'J18.9':  { description: 'Pneumonia, unspecified organism', category: 'Respiratory' },
  'K21.0':  { description: 'Gastro-oesophageal reflux disease with oesophagitis', category: 'Digestive' },
  'K59.0':  { description: 'Constipation, unspecified', category: 'Digestive' },
  'E11.9':  { description: 'Type 2 diabetes mellitus without complications', category: 'Endocrine' },
  'E10.9':  { description: 'Type 1 diabetes mellitus without complications', category: 'Endocrine' },
  'I10':    { description: 'Essential (primary) hypertension', category: 'Circulatory' },
  'I25.1':  { description: 'Atherosclerotic heart disease of native coronary artery', category: 'Circulatory' },
  'M54.5':  { description: 'Low back pain', category: 'Musculoskeletal' },
  'M54.2':  { description: 'Cervicalgia', category: 'Musculoskeletal' },
  'F41.1':  { description: 'Generalised anxiety disorder', category: 'Mental' },
  'F32.1':  { description: 'Moderate depressive episode', category: 'Mental' },
  'Z00.0':  { description: 'Encounter for general adult medical examination', category: 'Prevention' },
  'Z01.0':  { description: 'Encounter for examination of eyes and vision', category: 'Prevention' },
  'N39.0':  { description: 'Urinary tract infection, site not specified', category: 'Genitourinary' },
  'S62.001':{ description: 'Fracture of distal pole of navicular bone of right wrist', category: 'Injury' },
  'B34.9':  { description: 'Viral infection, unspecified', category: 'Infectious' },
  'L30.9':  { description: 'Dermatitis, unspecified', category: 'Skin' },
  'H10.9':  { description: 'Unspecified conjunctivitis', category: 'Eye' },
};

// ── NAPPI codes (National Pharmaceutical Product Interface) ───────────────────
export const NAPPI_CODES: Record<string, { name: string; strengthForm: string; scheduling: number; unitPriceZar: number }> = {
  '717460001': { name: 'Amoxicillin',       strengthForm: '500mg Capsules x21',   scheduling: 4, unitPriceZar: 89.50  },
  '717460002': { name: 'Amoxicillin/Clav',  strengthForm: '875mg/125mg x14',      scheduling: 4, unitPriceZar: 245.00 },
  '717461001': { name: 'Metformin',          strengthForm: '500mg Tablets x60',    scheduling: 4, unitPriceZar: 45.00  },
  '717462001': { name: 'Atorvastatin',       strengthForm: '40mg Tablets x30',     scheduling: 4, unitPriceZar: 189.00 },
  '717463001': { name: 'Amlodipine',         strengthForm: '5mg Tablets x30',      scheduling: 4, unitPriceZar: 65.00  },
  '717464001': { name: 'Omeprazole',         strengthForm: '20mg Capsules x30',    scheduling: 4, unitPriceZar: 78.00  },
  '717465001': { name: 'Salbutamol inhaler', strengthForm: '100mcg/dose 200doses', scheduling: 2, unitPriceZar: 95.00  },
  '717466001': { name: 'Ibuprofen',          strengthForm: '400mg Tablets x24',    scheduling: 1, unitPriceZar: 32.00  },
  '717467001': { name: 'Fluoxetine',         strengthForm: '20mg Capsules x28',    scheduling: 5, unitPriceZar: 145.00 },
  '717468001': { name: 'Citalopram',         strengthForm: '20mg Tablets x28',     scheduling: 5, unitPriceZar: 135.00 },
};

// ── SAMA/NHRPL tariff codes (common procedures) ───────────────────────────────
export const TARIFF_CODES: Record<string, { description: string; suggestedFeeZar: number; category: string }> = {
  '0190': { description: 'Consultation — new patient, first visit',       suggestedFeeZar: 850,  category: 'Consultation' },
  '0191': { description: 'Consultation — established patient',            suggestedFeeZar: 650,  category: 'Consultation' },
  '0192': { description: 'Consultation — complex/prolonged (>30 min)',    suggestedFeeZar: 1100, category: 'Consultation' },
  '0193': { description: 'Telephone consultation',                        suggestedFeeZar: 350,  category: 'Consultation' },
  '0194': { description: 'Home visit',                                    suggestedFeeZar: 1200, category: 'Visit' },
  '4000': { description: 'Minor surgical procedure (in-rooms)',           suggestedFeeZar: 750,  category: 'Surgical' },
  '4001': { description: 'Wound suture (simple)',                         suggestedFeeZar: 600,  category: 'Surgical' },
  '4002': { description: 'Cryotherapy',                                   suggestedFeeZar: 450,  category: 'Surgical' },
  '6000': { description: 'ECG with interpretation',                       suggestedFeeZar: 480,  category: 'Diagnostic' },
  '6001': { description: 'Spirometry',                                    suggestedFeeZar: 520,  category: 'Diagnostic' },
  '6002': { description: 'Glucose tolerance test',                        suggestedFeeZar: 380,  category: 'Diagnostic' },
  '7000': { description: 'Injection — intramuscular',                     suggestedFeeZar: 150,  category: 'Procedure' },
  '7001': { description: 'Intravenous cannula and infusion (first hour)', suggestedFeeZar: 620,  category: 'Procedure' },
  '8101': { description: 'Dental — Class I composite restoration',        suggestedFeeZar: 850,  category: 'Dental' },
  '8341': { description: 'Dental — Class II composite restoration',       suggestedFeeZar: 1200, category: 'Dental' },
};

// ── RA (Remittance Advice) reason codes — BHF standard ───────────────────────
export interface RaCode {
  code: string;
  description: string;
  category: 'rejected' | 'partial' | 'info' | 'error';
}

export const RA_CODES: Record<string, RaCode> = {
  'RA001': { code: 'RA001', description: 'Benefit exhausted for this benefit period',          category: 'rejected' },
  'RA002': { code: 'RA002', description: 'Service not a scheme benefit',                       category: 'rejected' },
  'RA003': { code: 'RA003', description: 'Waiting period applicable',                          category: 'rejected' },
  'RA004': { code: 'RA004', description: 'Pre-authorisation required but not obtained',        category: 'rejected' },
  'RA005': { code: 'RA005', description: 'Member not on scheme at date of service',            category: 'rejected' },
  'RA006': { code: 'RA006', description: 'Dependent not registered on membership',             category: 'rejected' },
  'RA007': { code: 'RA007', description: 'Claim submitted after 4-month limit',                category: 'rejected' },
  'RA008': { code: 'RA008', description: 'Duplicate claim',                                    category: 'rejected' },
  'RA009': { code: 'RA009', description: 'Co-payment applicable — patient liable for balance', category: 'partial'  },
  'RA010': { code: 'RA010', description: 'Amount exceeds scheme tariff — shortfall to patient',category: 'partial'  },
  'RA011': { code: 'RA011', description: 'Paid at scheme rate (not provider rate)',            category: 'info'     },
  'RA012': { code: 'RA012', description: 'ICD-10 code not compatible with procedure code',    category: 'error'    },
  'RA013': { code: 'RA013', description: 'Invalid ICD-10 code supplied',                      category: 'error'    },
  'RA014': { code: 'RA014', description: 'Invalid NAPPI code supplied',                       category: 'error'    },
  'RA015': { code: 'RA015', description: 'Provider BHF practice number invalid/not registered', category: 'error'  },
  'RA016': { code: 'RA016', description: 'Claim line amount exceeds scheduled fee by >20%',   category: 'partial'  },
  'RA017': { code: 'RA017', description: 'PMB condition — 100% benefit applicable',           category: 'info'     },
};

// ── Validation helpers ────────────────────────────────────────────────────────

export function isValidIcd10(code: string): boolean {
  return code in ICD10_CODES;
}

export function isValidNappi(code: string): boolean {
  return code in NAPPI_CODES;
}

export function isValidTariff(code: string): boolean {
  return code in TARIFF_CODES;
}

export function isValidScheme(code: string): boolean {
  return code in SA_SCHEMES;
}

/** BHF practice number format: 7-digit numeric string */
export function isValidBhfPracticeNumber(num: string): boolean {
  return /^\d{7}$/.test(num);
}

/** Medical aid membership number — scheme-prefixed alphanumeric (simplified) */
export function isValidMembershipNumber(num: string): boolean {
  return /^[A-Z0-9]{6,20}$/.test(num.trim().toUpperCase());
}

// ── PMB (Prescribed Minimum Benefit) conditions ───────────────────────────────
// These ICD-10 codes trigger 100% PMB benefit (simplified subset)
export const PMB_ICD10_CODES = new Set([
  'I10', 'E11.9', 'E10.9', 'J18.9', 'I25.1',
]);
