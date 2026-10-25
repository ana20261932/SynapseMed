import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import authRoutes from './routes/auth.routes';
import practiceRoutes from './routes/practice.routes';
import membershipRoutes from './routes/membership.routes';
import patientRoutes from './routes/patient.routes';
import appointmentRoutes from './routes/appointment.routes';
import clinicalRoutes from './routes/clinical.routes';
import billingRoutes from './routes/billing.routes';
import switchRoutes from './routes/switch.routes';
import inventoryRoutes from './routes/inventory.routes';
import healthRoutes from './routes/health.routes';

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.APP_BASE_URL ?? 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
if (process.env.NODE_ENV !== 'test') app.use(morgan('combined'));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false });
app.use('/api/', limiter);

app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/practices', practiceRoutes);
app.use('/api/v1/practices/:practiceId/memberships', membershipRoutes);
app.use('/api/v1/practices/:practiceId/patients', patientRoutes);
app.use('/api/v1/practices/:practiceId/appointments', appointmentRoutes);
app.use('/api/v1/practices/:practiceId/clinical', clinicalRoutes);
app.use('/api/v1/practices/:practiceId/billing', billingRoutes);
app.use('/api/v1/practices/:practiceId/switch', switchRoutes);
app.use('/api/v1/practices/:practiceId/inventory', inventoryRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
