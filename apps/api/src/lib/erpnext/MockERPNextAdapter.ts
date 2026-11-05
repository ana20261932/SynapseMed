import { randomUUID } from 'crypto';
import { IERPNextAdapter, ERPNextPatient, ERPNextAppointment, ERPNextEncounter, ERPNextSalesInvoice } from './IERPNextAdapter';

export class MockERPNextAdapter implements IERPNextAdapter {
  readonly providerName = 'erpnext-healthcare-mock';
  readonly isMock = true;
  private patients: Map<string, any> = new Map();
  private appointments: Map<string, any> = new Map();
  private encounters: Map<string, any> = new Map();
  private invoices: Map<string, any> = new Map();

  async ping() {
    return { ok: true, version: 'mock-erpnext-healthcare' };
  }

  async createPatient(patient: ERPNextPatient) {
    const name = `PAT-${Date.now()}-${randomUUID().slice(0, 8)}`;
    const record = { ...patient, name, creation: new Date().toISOString() };
    this.patients.set(name, record);
    return record as ERPNextPatient & { name: string };
  }

  async getPatient(patientId: string) {
    return this.patients.get(patientId) || null;
  }

  async updatePatient(patientId: string, updates: Partial<ERPNextPatient>) {
    const existing = this.patients.get(patientId) || {};
    const updated = { ...existing, ...updates, modified: new Date().toISOString() };
    this.patients.set(patientId, updated);
    return updated;
  }

  async createAppointment(appointment: ERPNextAppointment) {
    const name = `APP-${Date.now()}-${randomUUID().slice(0, 8)}`;
    const record = { ...appointment, name, status: appointment.status || 'Scheduled', creation: new Date().toISOString() };
    this.appointments.set(name, record);
    return record as ERPNextAppointment & { name: string };
  }

  async getAppointments(filters?: { patient?: string; date?: string }) {
    let results = Array.from(this.appointments.values());
    if (filters?.patient) results = results.filter(a => a.patient === filters.patient);
    if (filters?.date) results = results.filter(a => a.appointment_date === filters.date);
    return results;
  }

  async updateAppointment(appointmentId: string, updates: Partial<ERPNextAppointment>) {
    const existing = this.appointments.get(appointmentId) || {};
    const updated = { ...existing, ...updates, modified: new Date().toISOString() };
    this.appointments.set(appointmentId, updated);
    return updated;
  }

  async createEncounter(encounter: ERPNextEncounter) {
    const name = `ENC-${Date.now()}-${randomUUID().slice(0, 8)}`;
    const record = { ...encounter, name, creation: new Date().toISOString() };
    this.encounters.set(name, record);
    return record as ERPNextEncounter & { name: string };
  }

  async getEncounter(encounterId: string) {
    return this.encounters.get(encounterId) || null;
  }

  async createSalesInvoice(invoice: ERPNextSalesInvoice) {
    const name = `ACC-SINV-${Date.now()}-${randomUUID().slice(0, 8)}`;
    const items = invoice.items.map((it, idx) => ({ ...it, amount: it.amount || it.qty * it.rate, idx }));
    const total = items.reduce((sum, it) => sum + (it.amount || 0), 0);
    const record = { ...invoice, name, items, total, grand_total: total, status: 'Draft', creation: new Date().toISOString() };
    this.invoices.set(name, record);
    return record as ERPNextSalesInvoice & { name: string };
  }

  async getSalesInvoice(invoiceId: string) {
    return this.invoices.get(invoiceId) || null;
  }
}

let instance: MockERPNextAdapter | null = null;
export function getERPNextAdapter(): IERPNextAdapter {
  if (!instance) instance = new MockERPNextAdapter();
  return instance;
}
