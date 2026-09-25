import type { Entity } from '../../domain/index.js';

export interface BaseResource {
  id: string;
  isActive: boolean;
  createdDate: Date | null;
  createdBy: string | null;
  updatedDate: Date | null;
  updatedBy: string | null;
  deletedDate: Date | null;
  deletedBy: string | null;
}

// Common head of every resource: id + audit fields, in the API's field order.
export const toBaseResource = (entity: Entity<object>): BaseResource => ({
  id: entity.id,
  ...entity.audit,
});
