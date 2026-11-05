// ─────────────────────────────────────────────────────────────────────────────
// SynapseMed — Shared domain types, enums and constants
// Path-resolved by tsconfig paths — no npm workspace symlinks required.
// ─────────────────────────────────────────────────────────────────────────────

export type RegistrationStatus =
  | 'not_required'
  | 'unverified'
  | 'pending_review'
  | 'verified'
  | 'rejected'
  | 'expired'
  | 'suspended'
  | 'verification_unavailable';

export type PracticeRole =
  | 'owner'
  | 'admin'
  | 'practitioner'
  | 'nurse'
  | 'receptionist'
  | 'billing_staff'
  | 'stock_manager'
  | 'read_only';

export type MembershipStatus = 'active' | 'invited' | 'suspended' | 'removed';

export type OrganisationType =
  | 'independent_practitioner'
  | 'group_practice'
  | 'clinic'
  | 'imaging_centre'
  | 'laboratory'
  | 'hospital'
  | 'pharmacy'
  | 'other';

export type ModuleKey =
  | 'scheduling'
  | 'clinical_notes'
  | 'prescriptions'
  | 'billing'
  | 'switch'
  | 'inventory'
  | 'ai_admin'
  | 'transcription'
  | 'patient_portal'
  | 'advanced_reporting'
  | 'specialty_dental'
  | 'specialty_radiology'
  | 'specialty_psychiatry'
  | 'specialty_allied_health';

export type EntitlementStatus = 'active' | 'inactive' | 'grace_period' | 'suspended';

export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'cancelled'
  | 'unpaid'
  | 'paused';

export type BillingPeriod = 'monthly' | 'annual';

export type ClinicalNoteStatus = 'draft' | 'pending_review' | 'signed' | 'amended' | 'voided';

export type PrescriptionStatus =
  | 'draft'
  | 'pending_review'
  | 'signed'
  | 'dispensed'
  | 'cancelled';

export type EncounterStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';

export type AppointmentStatus =
  | 'booked'
  | 'confirmed'
  | 'arrived'
  | 'in_consultation'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type SwitchEnvironment = 'mock' | 'sandbox' | 'production';

export type SwitchUsageEventStatus =
  | 'simulated'
  | 'submitted'
  | 'accepted'
  | 'rejected'
  | 'reversed'
  | 'disputed';

export type SwitchConnectionStatus =
  | 'not_connected'
  | 'pending_approval'
  | 'active'
  | 'suspended'
  | 'revoked';

export type PaymentEventStatus =
  | 'pending'
  | 'succeeded'
  | 'failed'
  | 'refunded'
  | 'disputed'
  | 'cancelled';

export type AiJobPurpose =
  | 'draft_note'
  | 'draft_summary'
  | 'admin_classification'
  | 'reminder_suggestion'
  | 'inventory_forecast'
  | 'transcription';

export type AiJobStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'requires_review';

export type AuditAction =
  | 'user.login'
  | 'user.logout'
  | 'user.password_change'
  | 'practice.create'
  | 'practice.update'
  | 'membership.invite'
  | 'membership.accept'
  | 'membership.revoke'
  | 'patient.create'
  | 'patient.view'
  | 'patient.update'
  | 'clinical_note.create'
  | 'clinical_note.sign'
  | 'prescription.create'
  | 'prescription.sign'
  | 'billing.invoice_create'
  | 'switch.claim_submit'
  | 'switch.claim_reverse'
  | 'switch.activate'
  | 'payment.webhook_received'
  | 'payment.method_tokenized'
  | 'document.register'
  | 'entitlement.changed'
  | 'dental.chart_create'
  | 'dental.plan_create'
  | 'radiology.order_create'
  | 'radiology.report_create'
  | 'radiology.report_sign'
  | 'psychiatry.records_list'
  | 'psychiatry.record_create'
  | 'psychiatry.record_view'
  | 'psychiatry.record_sign'
  | 'allied_health.session_create'
  | 'allied_health.session_sign'
  | 'ai_job.create'
  | 'ai_job.review'
  | 'ai_job.redact'
  | 'transcription.create'
  | 'transcription.consent_grant'
  | 'transcription.audio_delete'
  | 'subscription.activate'
  | 'subscription.activate_free'
  | 'subscription.cancel';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}
