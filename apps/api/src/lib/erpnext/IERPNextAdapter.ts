/**
 * IERPNextAdapter — ERPNext Healthcare module integration interface
 * Integrates patient, appointment, clinical encounters, billing with ERPNext
 */
export interface ERPNextPatient {
  name?: string;
  patient_name: string;
  first_name?: string;
  last_name?: string;
  dob?: string;
  sex?: string;
  mobile?: string;
  email?: string;
  patient_id?: string;
}

export interface ERPNextAppointment {
  name?: string;
  patient: string;
  practitioner?: string;
  appointment_type?: string;
  department?: string;
  appointment_date: string;
  appointment_time?: string;
  status?: string;
}

export interface ERPNextEncounter {
  name?: string;
  patient: string;
  appointment?: string;
  practitioner?: string;
  encounter_date: string;
  symptoms?: string;
  diagnosis?: string;
  treatment_plan?: string;
}

export interface ERPNextSalesInvoice {
  name?: string;
  customer?: string;
  patient?: string;
  posting_date: string;
  items: Array<{
    item_code: string;
    qty: number;
    rate: number;
    amount?: number;
  }>;
  total?: number;
  grand_total?: number;
}

export interface IERPNextAdapter {
  readonly providerName: string;
  readonly isMock: boolean;
  // Patient
  createPatient(patient: ERPNextPatient): Promise<ERPNextPatient & { name: string }>;
  getPatient(patientId: string): Promise<ERPNextPatient | null>;
  updatePatient(patientId: string, updates: Partial<ERPNextPatient>): Promise<ERPNextPatient>;
  // Appointment
  createAppointment(appointment: ERPNextAppointment): Promise<ERPNextAppointment & { name: string }>;
  getAppointments(filters?: { patient?: string; date?: string }): Promise<ERPNextAppointment[]>;
  updateAppointment(appointmentId: string, updates: Partial<ERPNextAppointment>): Promise<ERPNextAppointment>;
  // Clinical Encounter
  createEncounter(encounter: ERPNextEncounter): Promise<ERPNextEncounter & { name: string }>;
  getEncounter(encounterId: string): Promise<ERPNextEncounter | null>;
  // Billing
  createSalesInvoice(invoice: ERPNextSalesInvoice): Promise<ERPNextSalesInvoice & { name: string }>;
  getSalesInvoice(invoiceId: string): Promise<ERPNextSalesInvoice | null>;
  // Health check
  ping(): Promise<{ ok: boolean; version?: string }>;
}
