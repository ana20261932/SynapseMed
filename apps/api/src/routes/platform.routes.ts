import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { requirePracticeMembership } from '../middleware/requirePracticeMembership';
import { Errors } from '../lib/errors';
import { ApiResponse } from '@synapsemed/shared';

const router = Router({ mergeParams: true });

const KNOWN_PLATFORMS = [
  { name: 'SynapseMed API', url: '/api/v1/health', local: true },
  { name: 'OpenMRS Reference', url: 'https://demo.openmrs.org/openmrs/ws/rest/v1/ping', local: false },
  { name: 'OpenEMR Demo', url: 'https://demo.openemr.io/interface/', local: false },
  { name: 'FHIR Public R4', url: 'https://hapi.fhir.org/baseR4/metadata', local: false },
  { name: 'NHS Spine (demo)', url: 'https://api.demo.nhs.uk/health', local: false },
];

async function fetchWithTimeout(url: string, timeoutMs = 3000): Promise<{ ok: boolean; status?: number; ms: number }> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    return { ok: res.ok, status: res.status, ms: Date.now() - start };
  } catch (err) {
    return { ok: false, status: undefined, ms: Date.now() - start };
  }
}

async function checkPlatform(platform: (typeof KNOWN_PLATFORMS)[number]) {
  const result = platform.local
    ? await fetchWithTimeout(`http://127.0.0.1:8080${platform.url}`)
    : await fetchWithTimeout(platform.url);
  return {
    name: platform.name,
    url: platform.url,
    online: result.ok,
    status: result.status,
    responseTimeMs: result.ms,
    checkedAt: new Date().toISOString(),
  };
}

router.get('/platform-status', requireAuth, async (_req, res, next) => {
  try {
    const results = await Promise.all(KNOWN_PLATFORMS.map((p) => checkPlatform(p)));
    const online = results.filter((r) => r.online).length;
    res.json({
      success: true,
      data: {
        platforms: results,
        summary: { total: results.length, online, offline: results.length - online },
        checkedAt: new Date().toISOString(),
      },
    } satisfies ApiResponse);
  } catch (err) { next(err); }
});

// ── Recommended features (auto-approve per practice) ──
interface RecommendedFeature {
  id: string;
  title: string;
  description: string;
  category: string;
  effort: string;
  autoApprove: boolean;
}

const DEFAULT_FEATURES: RecommendedFeature[] = [
  {
    id: 'claims-auto-submission',
    title: 'Auto-submit insurance claims',
    description: 'Automatically submit completed encounter claims to the medical-aid switch on save.',
    category: 'Billing',
    effort: 'Low',
    autoApprove: true,
  },
  {
    id: 'sms-appointment-reminders',
    title: 'SMS appointment reminders',
    description: 'Send automated SMS reminders to patients 24 hours before appointments.',
    category: 'Patient Engagement',
    effort: 'Low',
    autoApprove: true,
  },
  {
    id: 'telehealth-video',
    title: 'Telehealth video consultations',
    description: 'Embedded video consultation rooms with screen sharing and recording.',
    category: 'Telehealth',
    effort: 'Medium',
    autoApprove: false,
  },
  {
    id: 'patient-portal',
    title: 'Patient self-service portal',
    description: 'Let patients book appointments, view records, and request repeat prescriptions online.',
    category: 'Patient Portal',
    effort: 'Medium',
    autoApprove: false,
  },
  {
    id: 'ehr-interop-fhir',
    title: 'FHIR R4 interoperability',
    description: 'Import/export patient records using FHIR R4 APIs for cross-platform exchange.',
    category: 'Interoperability',
    effort: 'High',
    autoApprove: false,
  },
  {
    id: 'analytics-dashboard',
    title: 'Practice analytics dashboard',
    description: 'Revenue, patient volume, and no-show rate trends with exportable reports.',
    category: 'Analytics',
    effort: 'Medium',
    autoApprove: true,
  },
];

const recommendedStore = new Map<string, RecommendedFeature[]>();

function getFeatures(practiceId: string): RecommendedFeature[] {
  let features = recommendedStore.get(practiceId);
  if (!features) {
    features = DEFAULT_FEATURES.map((f) => ({ ...f }));
    recommendedStore.set(practiceId, features);
  }
  return features;
}

router.get('/recommended-features', requireAuth, requirePracticeMembership(), async (req, res, next) => {
  try {
    const practiceId = req.practiceId!;
    res.json({ success: true, data: { features: getFeatures(practiceId) } } satisfies ApiResponse);
  } catch (err) { next(err); }
});

router.post('/recommended-features/:featureId/toggle', requireAuth, requirePracticeMembership(['owner', 'admin']), async (req, res, next) => {
  try {
    const practiceId = req.practiceId!;
    const { featureId } = req.params;
    const features = getFeatures(practiceId);
    const feature = features.find((f) => f.id === featureId);
    if (!feature) throw Errors.NOT_FOUND('Feature');
    feature.autoApprove = !feature.autoApprove;
    res.json({ success: true, data: { feature } } satisfies ApiResponse);
  } catch (err) { next(err); }
});

export default router;
