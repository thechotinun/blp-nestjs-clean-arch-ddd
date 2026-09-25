// Error keys of the todo module. Numeric codes are assigned in src/error-codes.ts.
export const TodoErrorKey = {
	NOT_FOUND: 'TODO_NOT_FOUND',
	INVALID_TITLE: 'INVALID_TODO_TITLE',
} as const;
export type TodoErrorKey = (typeof TodoErrorKey)[keyof typeof TodoErrorKey];
