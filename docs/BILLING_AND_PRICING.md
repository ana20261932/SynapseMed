# Subscription, Payment and Switch Billing

## Important pricing note
All figures below are **illustrative planning hypotheses**, not confirmed SynapseMed prices, supplier quotations or legal/tax advice. Validate market prices, VAT treatment, payment fees, switch contracts, support costs and hosting costs before publishing a price list.

## Indicative subscription ideas (ZAR)
- Free / New Practice: R0, limited users/features and synthetic-data demo support
- Solo Essentials: R149 per month
- Solo Plus: R299 per month
- Growing Practice: from R449 per practitioner per month
- Clinic / Advanced: from R1,499 per month
- Hospital / Enterprise: from R4,999 per month, scoped contract

Possible add-ons for modelling only:
- Booking and patient portal: R49–R99 per practice/month
- AI administration: R99–R249 per practice/month with usage caps
- Transcription: R99–R199 per practice/month with usage caps
- Inventory: R99–R199 per facility/month
- Specialty extension: R99–R249 per practitioner/month
- Advanced reporting: R49–R149 per practice/month
- Additional staff user: R29–R59 per user/month

Do not hardcode these values into UI logic. Store plan definitions and pricing in backend configuration, version them, and show applicable taxes and billing period clearly.

## Payment-card verification
- Use a replaceable payment-provider adapter; evaluate providers for South African availability, recurring billing, tokenization, card verification and webhook security.
- Prefer provider-hosted checkout or tokenization. Store provider customer/payment-method tokens only where allowed, never raw PAN or CVV.
- Distinguish a zero-value verification, temporary authorization, actual charge and refund. Tell users what will happen before they confirm.
- Verify signed webhooks on the server, enforce idempotency, and reconcile provider events against local records.
- A free plan can be configured to require no card.

## Separate insurance-switch charges
Model these as a separate product/service from the PMS subscription:
- Activation/setup fee (only if the contracted provider charges one)
- Monthly access or minimum commitment (if applicable)
- Per-claim/per-transaction charge
- Provider pass-through fee
- Optional SynapseMed service fee
- Reversals, rejected transactions, disputes and corrections
- Usage statement, separate invoice and reconciliation status

Only configure rates from actual written agreements. Keep mock/demo transactions free or explicitly labelled as simulation. Do not enable production claim transmission until the switch provider authorises the practice and application and all required contracts/credentials are in place.

## Example ledger separation
- `pms_subscription_invoice` and `pms_subscription_payment`
- `switch_usage_event`, `switch_provider_fee`, `switch_platform_fee`
- `switch_invoice`, `switch_payment`, `switch_reversal`, `switch_reconciliation`

Avoid merging the switch ledger into a generic subscription line item in ways that make charges opaque.
