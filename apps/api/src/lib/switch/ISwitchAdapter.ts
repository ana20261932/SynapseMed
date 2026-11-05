/**
 * ISwitchAdapter — provider-independent interface
 *
 * Any real switch provider (MediSwitch, Healthbridge, etc.) implements this
 * interface. The mock adapter is the default. To wire a real provider:
 *  1. Implement ISwitchAdapter with the provider's HTTP client
 *  2. Set SWITCH_PROVIDER=mediswitch (or healthbridge) in env
 *  3. Set SWITCH_API_BASE_URL, SWITCH_CLIENT_ID, SWITCH_CLIENT_SECRET
 *  4. Set contractApproved=true on SwitchProviderConnection
 *  5. Set ENABLE_REAL_CLAIM_SUBMISSION=true
 */

// ── Claim types ───────────────────────────────────────────────────────────────

export interface ClaimLine {
  lineNumber: number;
  /** SAMA/NHRPL tariff code or NAPPI code */
  code: string;
  /** 'tariff' | 'nappi' | 'procedure' */
  codeType: 'tariff' | 'nappi' | 'procedure';
  description: string;
  quantity: number;
  unitPriceZar: number;
  totalPriceZar: number;
  /** ICD-10 codes linked to this line (1–3) */
  diagnosisCodes: string[];
}

export interface SwitchClaim {
  /** Unique claim reference from PMS */
  claimReference: string;
  /** Date of service (ISO 8601 date string) */
  serviceDate: string;
  /** BHF 7-digit practice number */
  bhfPracticeNumber: string;
  /** Treating practitioner — HPCSA registration number */
  treatingPractitionerHpcsa: string;
  /** Medical aid scheme code (e.g. 'DISC') */
  schemeCode: string;
  /** Medical aid plan name */
  planCode: string;
  /** Member's medical aid membership number */
  membershipNumber: string;
  /** Dependant code: '00' for main member, '01','02'... for dependants */
  dependantCode: string;
  /** ICD-10 principal diagnosis code */
  principalDiagnosis: string;
  /** Additional ICD-10 codes (optional) */
  additionalDiagnoses?: string[];
  /** Claim line items */
  lines: ClaimLine[];
  /** Total billed amount */
  totalBilledZar: number;
}

export interface AdjudicationLine {
  lineNumber: number;
  code: string;
  billedAmountZar: number;
  approvedAmountZar: number;
  patientLiableZar: number;
  raCodes: string[];
  status: 'approved' | 'partial' | 'rejected';
}

export interface AdjudicationResult {
  /** Switch/scheme assigned reference */
  schemeRef: string;
  /** Overall claim status */
  status: 'accepted' | 'partial' | 'rejected' | 'error';
  /** Overall approved amount */
  totalApprovedZar: number;
  /** Patient liable (shortfall + copayment) */
  totalPatientLiableZar: number;
  /** Per-line adjudication */
  lines: AdjudicationLine[];
  /** Claim-level RA codes */
  claimRaCodes: string[];
  /** Human-readable messages */
  messages: string[];
  /** ISO timestamp of adjudication */
  adjudicatedAt: string;
  /** Whether this was a simulated response */
  isMock: boolean;
}

export interface ClaimStatusResult {
  schemeRef: string;
  status: 'pending' | 'accepted' | 'partial' | 'rejected' | 'reversed';
  adjudicationResult?: AdjudicationResult;
}

export interface ReversalResult {
  schemeRef: string;
  reversalRef: string;
  status: 'reversed';
  reversedAt: string;
  isMock: boolean;
}

// ── Adapter interface ─────────────────────────────────────────────────────────

export interface ISwitchAdapter {
  /** Human-readable provider name */
  readonly providerName: string;
  /** Whether this is a mock/sandbox adapter */
  readonly isMock: boolean;
  /** Submit a claim and receive adjudication */
  submitClaim(claim: SwitchClaim): Promise<AdjudicationResult>;
  /** Poll claim status by scheme reference */
  getClaimStatus(schemeRef: string): Promise<ClaimStatusResult>;
  /** Reverse a previously accepted/partial claim */
  reverseClaim(schemeRef: string, reason: string): Promise<ReversalResult>;
}
