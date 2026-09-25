import type { EntityAudit } from '../../domain/index.js';
import type { BaseOrmEntity } from './base.orm-entity.js';

// Shared by every *.mapper.ts so audit columns are mapped the same way everywhere.
export const toEntityAudit = (record: BaseOrmEntity): EntityAudit => ({
  isActive: record.isActive,
  createdDate: record.createdDate ?? null,
  createdBy: record.createdBy ?? null,
  updatedDate: record.updatedDate ?? null,
  updatedBy: record.updatedBy ?? null,
  deletedDate: record.deletedDate ?? null,
  deletedBy: record.deletedBy ?? null,
});

// Dates are owned by TypeORM (Create/Update/DeleteDateColumn), so only writable fields go back.
export const toAuditColumns = (
  audit: EntityAudit,
): Pick<
  BaseOrmEntity,
  'isActive' | 'createdBy' | 'updatedBy' | 'deletedBy'
> => ({
  isActive: audit.isActive,
  createdBy: audit.createdBy,
  updatedBy: audit.updatedBy,
  deletedBy: audit.deletedBy,
});
