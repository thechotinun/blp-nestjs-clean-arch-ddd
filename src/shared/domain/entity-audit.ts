export interface EntityAudit {
  isActive: boolean;
  createdDate: Date | null;
  createdBy: string | null;
  updatedDate: Date | null;
  updatedBy: string | null;
  deletedDate: Date | null;
  deletedBy: string | null;
}

// Audit of an entity that has not been persisted yet; dates are filled in by the database.
export const newEntityAudit = (): EntityAudit => ({
  isActive: true,
  createdDate: null,
  createdBy: null,
  updatedDate: null,
  updatedBy: null,
  deletedDate: null,
  deletedBy: null,
});
