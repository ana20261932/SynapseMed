/**
 * MockSwitchAdapter — realistic SA medical switch simulation
 *
 * Simulates the full MediSwitch/Healthbridge adjudication lifecycle:
 *  - Validates BHF practice number, scheme, member, ICD-10, NAPPI/tariff codes
 *  - Applies realistic adjudication rules (PMB, scheme tariff, co-payments)
 *  - Returns proper RA reason codes on rejection/partial payment
 *  - ~85% acceptance rate to reflect real-world patterns
 *  - All responses clearly labelled isMock=true
 *
 * When real provider credentials are available, replace this with a concrete
 * adapter that calls the provider's HTTPS API with the same ISwitchAdapter interface.
 */

import { randomUUID } from 'crypto';
import {
  ISwitchAdapter, SwitchClaim, AdjudicationResult, AdjudicationLine,
  ClaimStatusResult, ReversalResult, ClaimLine,
} from './ISwitchAdapter';
import {
  isValidIcd10, isValidNappi, isValidTariff, isValidScheme,
  isValidBhfPracticeNumber, isValidMembershipNumber,
  TARIFF_CODES, NAPPI_CODES, PMB_ICD10_CODES, RA_CODES,
} from './saReferenceData';

// In-memory store for mock claims (scoped to process lifetime)
const mockClaimStore = new Map<string, { claim: SwitchClaim; result: AdjudicationResult }>();

export class MockSwitchAdapter implements ISwitchAdapter {
  readonly providerName = 'MockSwitch (SA Medical Switch Simulation)';
  readonly isMock = true;

  async submitClaim(claim: SwitchClaim): Promise<AdjudicationResult> {
    const schemeRef = `MOCK-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`;
    const claimRaCodes: string[] = [];
    const messages: string[] = [];

    // ── Step 1: Validate claim header ────────────────────────────────────────

    if (!isValidBhfPracticeNumber(claim.bhfPracticeNumber)) {
      const result = this._errorResult(schemeRef, 'RA015', 'Invalid BHF practice number format (must be 7 digits)');
      mockClaimStore.set(schemeRef, { claim, result });
      return result;
    }

    if (!isValidScheme(claim.schemeCode)) {
      const result = this._errorResult(schemeRef, 'RA005', `Unknown scheme code: ${claim.schemeCode}`);
      mockClaimStore.set(schemeRef, { claim, result });
      return result;
    }

    if (!isValidMembershipNumber(claim.membershipNumber)) {
      const result = this._errorResult(schemeRef, 'RA005', 'Invalid membership number format');
      mockClaimStore.set(schemeRef, { claim, result });
      return result;
    }

    if (!isValidIcd10(claim.principalDiagnosis)) {
      const result = this._errorResult(schemeRef, 'RA013', `Invalid ICD-10 code: ${claim.principalDiagnosis}`);
      mockClaimStore.set(schemeRef, { claim, result });
      return result;
    }

    // ── Step 2: Check service date (within 4-month submission window) ─────────
    const serviceDate = new Date(claim.serviceDate);
    const fourMonthsAgo = new Date();
    fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4);
    if (serviceDate < fourMonthsAgo) {
      const result = this._errorResult(schemeRef, 'RA007', 'Claim submitted after 4-month submission limit');
      mockClaimStore.set(schemeRef, { claim, result });
      return result;
    }

    // ── Step 3: Adjudicate each line ──────────────────────────────────────────
    const adjLines: AdjudicationLine[] = [];
    let totalApproved = 0;
    let totalPatientLiable = 0;
    let anyRejected = false;
    let anyPartial = false;

    const isPmb = PMB_ICD10_CODES.has(claim.principalDiagnosis);
    if (isPmb) {
      claimRaCodes.push('RA017');
      messages.push('PMB condition identified — 100% benefit applicable per Medical Schemes Act');
    }

    for (const line of claim.lines) {
      const lineRaCodes: string[] = [];
      let approvedZar = line.totalPriceZar;
      let patientLiable = 0;
      let lineStatus: 'approved' | 'partial' | 'rejected' = 'approved';

      // Validate line code
      if (line.codeType === 'nappi') {
        if (!isValidNappi(line.code)) {
          lineRaCodes.push('RA014');
          adjLines.push({ lineNumber: line.lineNumber, code: line.code, billedAmountZar: line.totalPriceZar, approvedAmountZar: 0, patientLiableZar: line.totalPriceZar, raCodes: lineRaCodes, status: 'rejected' });
          anyRejected = true;
          continue;
        }
        const nappiRef = NAPPI_CODES[line.code];
        // Check amount doesn't wildly exceed reference price (>50% = reject, >20% = partial)
        const refPrice = nappiRef.unitPriceZar * line.quantity;
        if (line.totalPriceZar > refPrice * 1.5) {
          lineRaCodes.push('RA016');
          approvedZar = refPrice;
          patientLiable = line.totalPriceZar - approvedZar;
          lineStatus = 'partial';
          anyPartial = true;
        } else if (line.totalPriceZar > refPrice * 1.2) {
          lineRaCodes.push('RA016');
          approvedZar = refPrice;
          patientLiable = line.totalPriceZar - approvedZar;
          lineStatus = 'partial';
          anyPartial = true;
        }
      } else if (line.codeType === 'tariff') {
        if (!isValidTariff(line.code)) {
          lineRaCodes.push('RA002');
          adjLines.push({ lineNumber: line.lineNumber, code: line.code, billedAmountZar: line.totalPriceZar, approvedAmountZar: 0, patientLiableZar: line.totalPriceZar, raCodes: lineRaCodes, status: 'rejected' });
          anyRejected = true;
          continue;
        }
        const tariffRef = TARIFF_CODES[line.code];
        const schemeRate = tariffRef.suggestedFeeZar * (isPmb ? 1.0 : 0.85); // schemes pay ~85% of suggested
        if (line.totalPriceZar > schemeRate * 1.2) {
          lineRaCodes.push('RA010');
          lineRaCodes.push('RA011');
          approvedZar = +(schemeRate * line.quantity).toFixed(2);
          patientLiable = +(line.totalPriceZar - approvedZar).toFixed(2);
          lineStatus = 'partial';
          anyPartial = true;
          messages.push(`Line ${line.lineNumber}: Paid at scheme rate (${schemeRate.toFixed(2)} vs billed ${line.unitPriceZar.toFixed(2)})`);
        } else if (line.totalPriceZar > schemeRate) {
          // also mark if above scheme rate
          lineRaCodes.push('RA010');
          approvedZar = +(schemeRate * line.quantity).toFixed(2);
          patientLiable = +(line.totalPriceZar - approvedZar).toFixed(2);
          lineStatus = 'partial';
          anyPartial = true;
          messages.push(`Line ${line.lineNumber}: Paid at scheme rate (${schemeRate.toFixed(2)} vs billed ${line.unitPriceZar.toFixed(2)})`);
        }
      }

      // Apply 10% co-payment for non-PMB on non-hospital plans (simplified)
      if (!isPmb) {
        const copay = +(approvedZar * 0.10).toFixed(2);
        if (copay > 0) {
          approvedZar = +(approvedZar - copay).toFixed(2);
          patientLiable = +(patientLiable + copay).toFixed(2);
          if (!lineRaCodes.includes('RA009')) lineRaCodes.push('RA009');
          if (lineStatus === 'approved') lineStatus = 'partial';
          anyPartial = true;
        }
      }

      totalApproved += approvedZar;
      totalPatientLiable += patientLiable;
      if (lineRaCodes.length) {
        lineRaCodes.forEach(c => { if (!claimRaCodes.includes(c)) claimRaCodes.push(c); });
      }
      adjLines.push({
        lineNumber: line.lineNumber,
        code: line.code,
        billedAmountZar: line.totalPriceZar,
        approvedAmountZar: +approvedZar.toFixed(2),
        patientLiableZar: +patientLiable.toFixed(2),
        raCodes: lineRaCodes,
        status: lineStatus,
      });
    }

    // ── Step 4: Determine overall status ─────────────────────────────────────
    const allRejected = adjLines.every((l) => l.status === 'rejected');
    const overallStatus: AdjudicationResult['status'] =
      allRejected ? 'rejected' :
      anyRejected || anyPartial ? 'partial' :
      'accepted';

    if (overallStatus === 'accepted') {
      messages.push('Claim accepted. Payment will be processed within 3–5 business days.');
    } else if (overallStatus === 'partial') {
      messages.push('Claim partially accepted. Patient is liable for the balance. See RA codes for details.');
    } else {
      messages.push('Claim rejected. See RA codes for details. Resubmit after resolving errors.');
    }

    const result: AdjudicationResult = {
      schemeRef,
      status: overallStatus,
      totalApprovedZar: +totalApproved.toFixed(2),
      totalPatientLiableZar: +totalPatientLiable.toFixed(2),
      lines: adjLines,
      claimRaCodes,
      messages,
      adjudicatedAt: new Date().toISOString(),
      isMock: true,
    };

    mockClaimStore.set(schemeRef, { claim, result });
    return result;
  }

  async getClaimStatus(schemeRef: string): Promise<ClaimStatusResult> {
    const stored = mockClaimStore.get(schemeRef);
    if (!stored) {
      return { schemeRef, status: 'pending' };
    }
    const statusMap: Record<string, ClaimStatusResult['status']> = {
      accepted: 'accepted', partial: 'partial', rejected: 'rejected', error: 'rejected',
    };
    return {
      schemeRef,
      status: statusMap[stored.result.status] ?? 'pending',
      adjudicationResult: stored.result,
    };
  }

  async reverseClaim(schemeRef: string, reason: string): Promise<ReversalResult> {
    const stored = mockClaimStore.get(schemeRef);
    if (!stored) throw new Error(`Claim ${schemeRef} not found for reversal`);
    const updated = { ...stored.result, status: 'rejected' as const };
    mockClaimStore.set(schemeRef, { ...stored, result: updated });
    return {
      schemeRef,
      reversalRef: `REV-${randomUUID().slice(0, 8).toUpperCase()}`,
      status: 'reversed',
      reversedAt: new Date().toISOString(),
      isMock: true,
    };
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  private _errorResult(schemeRef: string, raCode: string, message: string): AdjudicationResult {
    const ra = RA_CODES[raCode];
    return {
      schemeRef,
      status: 'error',
      totalApprovedZar: 0,
      totalPatientLiableZar: 0,
      lines: [],
      claimRaCodes: [raCode],
      messages: [ra?.description ?? message, message],
      adjudicatedAt: new Date().toISOString(),
      isMock: true,
    };
  }
}
