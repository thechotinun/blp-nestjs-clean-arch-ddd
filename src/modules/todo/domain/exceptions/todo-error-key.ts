/**
 * Error keys of the todo module. Numeric codes are assigned in src/error-codes.ts.
 * Each key names a violated business rule or a missing aggregate, in domain language —
 * never a technical failure (DB/persistence errors are infrastructure and surface as 500).
 * Add a key together with the exception that throws it.
 */
export const TodoErrorKey = {
	NOT_FOUND: 'TODO_NOT_FOUND',
	INVALID_TITLE: 'INVALID_TODO_TITLE',
} as const;
export type TodoErrorKey = (typeof TodoErrorKey)[keyof typeof TodoErrorKey];
