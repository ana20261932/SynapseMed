import { prisma } from './prisma';
import { AuditAction } from '@synapsemed/shared';

interface AuditParams {
  actorId?: string;
  practiceId?: string;
  action: AuditAction;
  resourceType?: string;
  resourceId?: string;
  result?: 'success' | 'failure';
  ipAddress?: string;
  correlationId?: string;
  metadata?: Record<string, unknown>;
}

/** Records an immutable audit event. Never include raw PHI in metadata. */
export async function audit(params: AuditParams): Promise<void> {
  await prisma.auditEvent.create({
    data: {
      actorId: params.actorId,
      practiceId: params.practiceId,
      action: params.action,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      result: params.result ?? 'success',
      ipAddress: params.ipAddress,
      correlationId: params.correlationId,
      metadata: params.metadata ? JSON.stringify(params.metadata) : undefined,
    },
  });
}
