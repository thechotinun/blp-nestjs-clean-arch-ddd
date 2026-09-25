/** Common head of every read model: id + audit fields, in API field order. Empty values are `null`. */
export interface BaseView {
	id: string;
	isActive: boolean;
	createdDate: Date | null;
	createdBy: string | null;
	updatedDate: Date | null;
	updatedBy: string | null;
	deletedDate: Date | null;
	deletedBy: string | null;
}
