import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { apiClient } from '@/lib/apiClient';
import { Layout } from '@/components/layout/Layout';
import { Card, Button, Input, Badge, Table } from '@/components/ui';
import { Modal } from '@/components/ui/Modal';

interface User { id: string; email: string; firstName: string; lastName: string; }
interface Practice { id: string; name: string; role: string; moduleEntitlements?: Array<{ moduleKey: string; status: string }>; }
interface InventoryItem { id: string; sku: string; name: string; description?: string; nappiCode?: string | null; unit: string; quantity: number; lowStockThreshold: number; batchTracked: boolean; expiryTracked: boolean; createdAt: string; }
interface SwitchConnection { id: string; providerName: string; environment: string; connectionStatus: string; contractApproved: boolean; }

export default function PharmacyPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [practices, setPractices] = useState<Practice[]>([]);
  const [activePractice, setActivePractice] = useState<Practice | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [switchConn, setSwitchConn] = useState<SwitchConnection | null>(null);
  const [loading, setLoading] = useState(true);
  /* Add item state */
  const [addOpen, setAddOpen] = useState(false);
  const [addingItem, setAddingItem] = useState(false);
  const [newItem, setNewItem] = useState({
    sku: '',
    name: '',
    nappiCode: '',
    unit: 'unit',
    quantity: '0',
    lowStockThreshold: '5',
    batchTracked: false,
    expiryTracked: false,
    description: '',
  });

  /* Dispense on medical aid state */
  const [dispenseOpen, setDispenseOpen] = useState(false);
  const [dispensing, setDispensing] = useState(false);
  const [dispenseResult, setDispenseResult] = useState<any>(null);
  const [dispenseError, setDispenseError] = useState('');
  const [selectedItems, setSelectedItems] = useState<Array<{ itemId: string; quantity: number }>>([]);
  const [dispenseForm, setDispenseForm] = useState({
    bhfPracticeNumber: '',
    treatingPractitionerHpcsa: '',
    schemeCode: '',
    membershipNumber: '',
    dependantCode: '00',
    principalDiagnosis: '',
    serviceDate: new Date().toISOString().slice(0, 10),
  });

  const nappiItems = items.filter(i => i.nappiCode);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) { router.push('/login'); return; }
    Promise.all([
      apiClient.get<User>('/api/v1/auth/me', token),
      apiClient.get<Practice[]>('/api/v1/practices', token),
    ])
      .then(([u, p]) => {
        setUser(u);
        setPractices(p);
        setActivePractice(p[0] || null);
      })
      .catch(() => { localStorage.removeItem('accessToken'); router.push('/login'); })
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    if (!activePractice) return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    apiClient.get<InventoryItem[]>(`/api/v1/practices/${activePractice.id}/inventory`, token)
      .then(setItems)
      .catch(() => setItems([]));
    apiClient.get<SwitchConnection>(`/api/v1/practices/${activePractice.id}/switch/connection`, token)
      .then(setSwitchConn)
      .catch(() => setSwitchConn(null));
  }, [activePractice]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-clinic-500">Loading…</div>;
  if (!user) return <div className="min-h-screen flex items-center justify-center text-clinic-500">Not authenticated</div>;

  const lowStock = items.filter(i => i.quantity <= i.lowStockThreshold);

  const toggleItem = (itemId: string) => {
    setSelectedItems(prev => {
      const exists = prev.find(i => i.itemId === itemId);
      if (exists) return prev.filter(i => i.itemId !== itemId);
      return [...prev, { itemId, quantity: 1 }];
    });
  };

  const setItemQty = (itemId: string, qty: number) => {
    setSelectedItems(prev => prev.map(i => i.itemId === itemId ? { ...i, quantity: Math.max(1, qty) } : i));
  };

  const removeItem = (itemId: string) => {
    setSelectedItems(prev => prev.filter(i => i.itemId !== itemId));
  };

  const submitDispense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePractice) return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    setDispensing(true); setDispenseError(''); setDispenseResult(null);
    try {
      const itemsPayload = selectedItems.map(si => ({
        inventoryItemId: si.itemId,
        quantity: si.quantity,
      }));
      const res = await apiClient.post<any>(`/api/v1/practices/${activePractice.id}/switch/claims/dispense`, {
        ...dispenseForm,
        items: itemsPayload,
      }, token);
      setDispenseResult(res);
      setDispenseOpen(false);
      apiClient.get<InventoryItem[]>(`/api/v1/practices/${activePractice.id}/inventory`, token).then(setItems);
    } catch (e: unknown) {
      setDispenseError(e instanceof Error ? e.message : 'Dispense failed');
    } finally {
      setDispensing(false);
    }
  };

  const submitAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePractice) return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    setAddingItem(true);
    try {
      const res = await apiClient.post<InventoryItem>(`/api/v1/practices/${activePractice.id}/inventory`, {
        sku: newItem.sku,
        name: newItem.name,
        description: newItem.description || undefined,
        nappiCode: newItem.nappiCode || undefined,
        unit: newItem.unit,
        quantity: Number(newItem.quantity || 0),
        lowStockThreshold: Number(newItem.lowStockThreshold || 5),
        batchTracked: newItem.batchTracked,
        expiryTracked: newItem.expiryTracked,
      }, token);
      setItems(prev => [res, ...prev]);
      setNewItem({
        sku: '', name: '', nappiCode: '', unit: 'unit',
        quantity: '0', lowStockThreshold: '5',
        batchTracked: false, expiryTracked: false, description: '',
      });
      setAddOpen(false);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to add item');
    } finally {
      setAddingItem(false);
    }
  };

  const isSwitchActive = switchConn?.connectionStatus === 'active';

  return (
    <>
      <Head><title>Pharmacy Inventory — SynapseMed</title></Head>
      <Layout
        user={user}
        practices={practices}
        activePractice={activePractice}
        onPracticeChange={(p) => setActivePractice(p)}
        onLogout={() => { localStorage.clear(); router.push('/login'); }}
      >
        <div className="mb-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-clinic-900">Pharmacy Inventory</h1>
              <p className="text-clinic-500 text-sm">Stock, batch/expiry tracking, medication workflow and medical-aid dispensing</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setAddOpen(true)}>+ Add Item</Button>
              <Button variant={isSwitchActive ? 'secondary' : 'outline'} onClick={() => setDispenseOpen(true)} disabled={!isSwitchActive}>
                Dispense on Medical Aid
              </Button>
            </div>
          </div>
          <div className="dev-banner mt-4">
            ⚠️ Development environment — synthetic data only. Not for clinical use. All medical-aid claims are simulated unless a live switch contract is approved.
          </div>
          {!isSwitchActive && (
            <div className="mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              Switch not connected. Activate a switch connection to dispense medicine on medical aid.
            </div>
          )}

          {/* Low stock alert */}
          {lowStock.length > 0 && (
            <Card className="mb-8 bg-amber-50 border border-amber-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-amber-900 mb-1">Low Stock Alert</h3>
                  <p className="text-sm text-amber-700">{lowStock.length} item(s) at or below reorder threshold.</p>
                </div>
              </div>
            </Card>
          )}

          {/* Inventory table */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-clinic-900">Stock Items</h2>
              <span className="text-xs text-clinic-500">{nappiItems.length} of {items.length} items have NAPPI codes for medical-aid claiming</span>
            </div>
            <Table
              columns={['SKU', 'Name', 'NAPPI', 'Unit', 'Quantity', 'Threshold', 'Status', 'Actions']}
              data={items}
              renderCell={(row, col) => {
                if (col === 'SKU') return <span className="font-medium text-clinic-900 text-sm">{row.sku}</span>;
                if (col === 'Name') return <span className="font-medium text-clinic-900">{row.name}</span>;
                if (col === 'NAPPI') return (
                  <span className={`text-clinic-600 text-sm font-mono ${row.nappiCode ? 'text-synapse-700' : 'text-clinic-400'}`}>
                    {row.nappiCode || '—'}
                  </span>
                );
                if (col === 'Unit') return <span className="text-clinic-600 text-sm">{row.unit}</span>;
                if (col === 'Quantity') return (
                  <span className={`font-medium ${row.quantity <= row.lowStockThreshold ? 'text-red-600' : 'text-clinic-900'}`}>
                    {row.quantity}
                  </span>
                );
                if (col === 'Threshold') return <span className="text-clinic-600 text-sm">{row.lowStockThreshold}</span>;
                if (col === 'Status') return (
                  <Badge variant={row.quantity <= row.lowStockThreshold ? 'warning' : 'verified'}>
                    {row.quantity <= row.lowStockThreshold ? 'LOW STOCK' : 'OK'}
                  </Badge>
                );
                if (col === 'Actions') {
                  const sel = selectedItems.find(s => s.itemId === row.id);
                  return (
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => toggleItem(row.id)} disabled={!row.nappiCode}>
                        {sel ? 'Selected' : (row.nappiCode ? 'Select' : 'No NAPPI')}
                      </Button>
                      <Button variant="outline" size="sm">Stock</Button>
                    </div>
                  );
                }
                return String(row[col]);
              }}
              emptyMessage="No inventory items."
            />
          </Card>

          {/* Selected items summary for dispense */}
          {selectedItems.length > 0 && (
            <Card className="mb-8 bg-synapse-50 border border-synapse-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-clinic-900">Selected for Dispense</h2>
                <Button variant="outline" size="sm" onClick={() => setSelectedItems([])}>Clear</Button>
              </div>
              <div className="space-y-2">
                {selectedItems.map(si => {
                  const item = items.find(i => i.id === si.itemId);
                  if (!item) return null;
                  return (
                    <div key={si.itemId} className="flex items-center justify-between gap-4 p-3 border border-clinic-200 rounded-xl bg-white">
                      <div className="flex-1">
                        <div className="font-medium text-clinic-900">{item.name}</div>
                        <div className="text-xs text-clinic-500">SKU: {item.sku} • NAPPI: {item.nappiCode}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-20">
                          <label className="block text-xs text-clinic-600 mb-1">Qty</label>
                          <input
                            type="number"
                            min={1}
                            max={item.quantity}
                            value={si.quantity}
                            onChange={e => setItemQty(si.itemId, Math.max(1, Math.min(item.quantity, Number(e.target.value || 1))))}
                            className="w-full border border-clinic-300 rounded px-2 py-1.5 text-sm"
                            disabled={si.quantity >= item.quantity}
                          />
                        </div>
                        <Button variant="outline" size="sm" onClick={() => removeItem(si.itemId)}>Remove</Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>

        {/* Dispense on Medical Aid Modal */}
        <Modal
          isOpen={dispenseOpen}
          onClose={() => { setDispenseOpen(false); setDispenseError(''); setDispenseResult(null); }}
          title="Dispense Medicine on Medical Aid"
          size="xl"
        >
          <form className="space-y-6" onSubmit={submitDispense}>
            {dispenseError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{dispenseError}</div>}
            {dispenseResult && (
              <div className="bg-synapse-50 border border-synapse-200 text-synapse-800 text-sm rounded-xl px-4 py-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={dispenseResult.status === 'accepted' ? 'verified' : dispenseResult.status === 'partial' ? 'warning' : 'danger'}>
                    {dispenseResult.status.toUpperCase()}
                  </Badge>
                  <span className="text-xs text-clinic-500">Scheme Ref: {dispenseResult.schemeRef}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-xs text-clinic-500">Total Billed</div>
                    <div className="font-medium text-clinic-900">R{dispenseResult.totalBilledZar.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-clinic-500">Approved</div>
                    <div className="font-medium text-clinic-900">R{dispenseResult.totalApprovedZar.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-clinic-500">Patient Liable</div>
                    <div className="font-medium text-clinic-900">R{dispenseResult.totalPatientLiableZar.toFixed(2)}</div>
                  </div>
                </div>
                {dispenseResult.stockDeducted?.length && (
                  <div className="mt-3">
                    <div className="text-xs text-clinic-500 mb-1">Stock Deducted:</div>
                    <div className="text-sm text-clinic-900">{dispenseResult.stockDeducted.map((s: any) => `${s.name} ×${s.quantity}`).join(', ')}</div>
                  </div>
                )}
                {dispenseResult.messages && (
                  <div className="mt-3 text-xs text-clinic-600">{dispenseResult.messages.join(' • ')}</div>
                )}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Input label="BHF Practice Number" value={dispenseForm.bhfPracticeNumber} onChange={e => setDispenseForm(s => ({ ...s, bhfPracticeNumber: e.target.value }))} required />
              <Input label="Practitioner HPCSA" value={dispenseForm.treatingPractitionerHpcsa} onChange={e => setDispenseForm(s => ({ ...s, treatingPractitionerHpcsa: e.target.value }))} required />
              <Input label="Service Date" type="date" value={dispenseForm.serviceDate} onChange={e => setDispenseForm(s => ({ ...s, serviceDate: e.target.value }))} required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input label="Scheme Code (e.g. DISC)" value={dispenseForm.schemeCode} onChange={e => setDispenseForm(s => ({ ...s, schemeCode: e.target.value }))} required />
              <Input label="Membership Number" value={dispenseForm.membershipNumber} onChange={e => setDispenseForm(s => ({ ...s, membershipNumber: e.target.value }))} required />
              <Input label="Dependant Code" value={dispenseForm.dependantCode} onChange={e => setDispenseForm(s => ({ ...s, dependantCode: e.target.value }))} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Principal ICD-10 Diagnosis" value={dispenseForm.principalDiagnosis} onChange={e => setDispenseForm(s => ({ ...s, principalDiagnosis: e.target.value }))} required />
            </div>
            <div className="border border-clinic-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-clinic-900">Medicines to Dispense</h3>
                <span className="text-xs text-clinic-500">{selectedItems.length} item(s) selected from inventory</span>
              </div>
              {selectedItems.length === 0 && (
                <div className="text-center py-8 text-clinic-500 text-sm">
                  Select inventory items with NAPPI codes from the table above to dispense on medical aid.
                </div>
              )}
              {selectedItems.map(si => {
                const item = items.find(i => i.id === si.itemId);
                if (!item) return null;
                return (
                  <div key={si.itemId} className="flex items-center justify-between gap-4 p-3 border border-clinic-200 rounded-lg bg-white mb-2">
                    <div className="flex-1">
                      <div className="font-medium text-clinic-900">{item.name}</div>
                      <div className="text-xs text-clinic-500">SKU: {item.sku} • NAPPI: {item.nappiCode} • Avail: {item.quantity}</div>
                    </div>
                    <div className="w-32">
                      <label className="block text-xs text-clinic-600 mb-1">Qty to dispense</label>
                      <input
                        type="number"
                        min={1}
                        max={item.quantity}
                        value={si.quantity}
                        onChange={e => setItemQty(si.itemId, Math.max(1, Math.min(item.quantity, Number(e.target.value || 1))))}
                        className="w-full border border-clinic-300 rounded px-3 py-2 text-sm"
                      />
                    </div>
                    <Button variant="outline" size="sm" onClick={() => removeItem(si.itemId)}>Remove</Button>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-clinic-100">
              <Button variant="outline" type="button" onClick={() => { setDispenseOpen(false); setDispenseError(''); setDispenseResult(null); }} disabled={dispensing}>Cancel</Button>
              <Button variant="primary" type="submit" isLoading={dispensing} disabled={dispensing || selectedItems.length === 0 || !isSwitchActive}>Submit Claim to Medical Aid</Button>
            </div>
          </form>
        </Modal>

        <Modal
          isOpen={addOpen}
          onClose={() => setAddOpen(false)}
          title="Add Inventory Item"
          size="lg"
        >
          <form className="space-y-4" onSubmit={submitAddItem}>
            <div className="grid grid-cols-2 gap-4">
              <Input label="SKU" value={newItem.sku} onChange={e => setNewItem(s => ({ ...s, sku: e.target.value }))} required />
              <Input label="Item Name" value={newItem.name} onChange={e => setNewItem(s => ({ ...s, name: e.target.value }))} required />
              <Input label="NAPPI Code (medical aid claiming)" placeholder="e.g. 717460001" value={newItem.nappiCode} onChange={e => setNewItem(s => ({ ...s, nappiCode: e.target.value }))} />
              <Input label="Unit" value={newItem.unit} onChange={e => setNewItem(s => ({ ...s, unit: e.target.value }))} />
              <Input label="Initial Quantity" type="number" value={newItem.quantity} onChange={e => setNewItem(s => ({ ...s, quantity: e.target.value }))} />
              <Input label="Low Stock Threshold" type="number" value={newItem.lowStockThreshold} onChange={e => setNewItem(s => ({ ...s, lowStockThreshold: e.target.value }))} />
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="batchTracked"
                  checked={newItem.batchTracked}
                  onChange={e => setNewItem(s => ({ ...s, batchTracked: e.target.checked }))}
                  className="w-4 h-4 text-synapse-600 border-clinic-300 rounded focus:ring-synapse-500"
                />
                <label htmlFor="batchTracked" className="text-sm text-clinic-600">Batch tracked</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="expiryTracked"
                  checked={newItem.expiryTracked}
                  onChange={e => setNewItem(s => ({ ...s, expiryTracked: e.target.checked }))}
                  className="w-4 h-4 text-synapse-600 border-clinic-300 rounded focus:ring-synapse-500"
                />
                <label htmlFor="expiryTracked" className="text-sm text-clinic-600">Expiry tracked</label>
              </div>
              <Input label="Description" as="textarea" rows={2} value={newItem.description} onChange={e => setNewItem(s => ({ ...s, description: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-clinic-100">
              <Button variant="outline" type="button" onClick={() => setAddOpen(false)} disabled={addingItem}>Cancel</Button>
              <Button variant="primary" type="submit" isLoading={addingItem} disabled={addingItem}>Add Item</Button>
            </div>
          </form>
        </Modal>
      </Layout>
    </>
  );
}
