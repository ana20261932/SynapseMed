import { Router } from 'express';
import { ibmServices } from '../lib/ibm';
const router = Router();
router.get('/', (_req, res) => {
  res.json({
    success: true,
    data: {
      service: 'SynapseMed API', version: '0.1.0', status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV ?? 'development',
      syntheticData: process.env.USE_SYNTHETIC_DATA === 'true',
      ibmServices: ibmServices.status(),
    },
  });
});
export default router;
