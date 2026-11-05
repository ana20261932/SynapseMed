import React, { useState } from 'react';
import { Card, Button } from '@/components/ui';

interface ClinicalEncounterCanvasProps {
  patientId: string;
  practiceId: string;
  onSave?: (data: any) => void;
}

export function ClinicalEncounterCanvas({ patientId, practiceId, onSave }: ClinicalEncounterCanvasProps) {
  const [activeSection, setActiveSection] = useState('chief_complaint');
  const [formData, setFormData] = useState({
    chief_complaint: '',
    history: '',
    vitals: { bp: '', pulse: '', temp: '', rr: '', weight: '', height: '' },
    examination: '',
    assessment: '',
    plan: '',
    medicines: '',
    allergies: '',
    referrals: '',
    follow_up: '',
  });
  const [aiDraft, setAiDraft] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [templateVersion] = useState('1.0');

  const sections = [
    { key: 'chief_complaint', label: 'Chief Complaint' },
    { key: 'history', label: 'History' },
    { key: 'vitals', label: 'Vitals' },
    { key: 'examination', label: 'Examination' },
    { key: 'assessment', label: 'Assessment' },
    { key: 'plan', label: 'Plan' },
    { key: 'medicines', label: 'Medicines/Allergies' },
    { key: 'referrals', label: 'Referrals' },
    { key: 'follow_up', label: 'Follow-up' },
  ];

  const generateAIDraft = () => {
    setAiDraft([
      { section: 'assessment', suggestion: 'Consider differential diagnosis based on presented symptoms. Requires clinician review.', confidence: 0.7 },
      { section: 'plan', suggestion: 'Symptomatic treatment with follow-up in 7 days. Monitor for red flags.', confidence: 0.65 },
    ]);
  };

  const handleSave = async () => {
    setSaving(true);
    // Simulate save
    await new Promise(r => setTimeout(r, 500));
    setSaving(false);
    setSaved(true);
    if (onSave) onSave({ ...formData, templateVersion, aiDraftApproved: false });
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)] min-h-[600px]">
      {/* Left: Clinical Note Editor */}
      <Card className="flex flex-col overflow-hidden">
        <div className="border-b border-clinic-100 pb-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-clinic-900">Clinical Encounter</h2>
            <span className="text-xs text-clinic-500">Template v{templateVersion} • {saved ? '✓ Saved' : saving ? 'Saving...' : 'Autosave enabled'}</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {sections.map(s => (
              <button
                key={s.key}
                onClick={() => setActiveSection(s.key)}
                className={`px-3 py-1 text-xs rounded-full ${activeSection === s.key ? 'bg-synapse-100 text-synapse-700' : 'bg-clinic-50 text-clinic-600 hover:bg-clinic-100'}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          {activeSection === 'vitals' ? (
            <div className="grid grid-cols-2 gap-3">
              {Object.keys(formData.vitals).map(key => (
                <div key={key}>
                  <label className="text-xs text-clinic-600 uppercase">{key}</label>
                  <input
                    type="text"
                    className="w-full mt-1 px-3 py-2 border border-clinic-200 rounded-lg text-sm"
                    value={(formData.vitals as any)[key]}
                    onChange={(e) => setFormData({ ...formData, vitals: { ...formData.vitals, [key]: e.target.value } })}
                  />
                </div>
              ))}
            </div>
          ) : activeSection === 'medicines' ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-clinic-600 uppercase">Medicines</label>
                <textarea
                  className="w-full mt-1 px-3 py-2 border border-clinic-200 rounded-lg text-sm h-32"
                  value={formData.medicines}
                  onChange={(e) => setFormData({ ...formData, medicines: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-clinic-600 uppercase">Allergies</label>
                <textarea
                  className="w-full mt-1 px-3 py-2 border border-clinic-200 rounded-lg text-sm h-24"
                  value={formData.allergies}
                  onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                />
              </div>
            </div>
          ) : (
            <textarea
              className="w-full h-full px-3 py-2 border border-clinic-200 rounded-lg text-sm resize-none"
              value={(formData as any)[activeSection] || ''}
              onChange={(e) => setFormData({ ...formData, [activeSection]: e.target.value })}
              placeholder={`Enter ${sections.find(s => s.key === activeSection)?.label.toLowerCase()}...`}
            />
          )}
        </div>
        <div className="pt-4 border-t border-clinic-100 mt-4">
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? 'Saving...' : 'Verify and Save to Patient Timeline'}
          </Button>
          <p className="text-xs text-clinic-500 text-center mt-2">AI draft suggestions must not silently write to signed/final clinical record</p>
        </div>
      </Card>

      {/* Right: AI Draft Insights */}
      <Card className="flex flex-col overflow-hidden">
        <div className="border-b border-clinic-100 pb-4 mb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-clinic-900">AI Draft Insights</h2>
            <Button variant="outline" size="sm" onClick={generateAIDraft}>Generate Draft</Button>
          </div>
          <p className="text-xs text-clinic-500 mt-1">⚠️ All AI output requires clinician review - mock provider by default</p>
        </div>
        <div className="flex-1 overflow-auto space-y-3">
          {aiDraft.length === 0 ? (
            <div className="text-center text-clinic-500 py-8">
              <p className="text-sm">Click "Generate Draft" for AI suggestions</p>
              <p className="text-xs mt-1">Drafts are not automatically applied to the note</p>
            </div>
          ) : (
            aiDraft.map((draft, idx) => (
              <div key={idx} className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-amber-700 uppercase">{draft.section.replace('_', ' ')}</span>
                  <span className="text-xs text-amber-600">{Math.round(draft.confidence * 100)}% confidence</span>
                </div>
                <p className="text-sm text-amber-900">{draft.suggestion}</p>
                <div className="flex gap-2 mt-2">
                  <Button variant="outline" size="sm">Review</Button>
                  <Button variant="ghost" size="sm">Discard</Button>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="pt-4 border-t border-clinic-100 mt-4">
          <p className="text-xs text-clinic-500 text-center">AI output is draft only • Requires human approval</p>
        </div>
      </Card>
    </div>
  );
}

export default ClinicalEncounterCanvas;
