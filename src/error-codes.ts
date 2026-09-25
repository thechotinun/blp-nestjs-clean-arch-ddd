import type { TodoErrorKey } from './modules/todo/domain/index.js';
import type { SystemErrorKey } from './shared/presentation/index.js';

/**
 * Single catalog of API error codes: `{ code: key }`.
 * - Duplicate codes fail to compile (TS1117).
 * - Duplicate keys fail at startup (ErrorCodeRegistry) and in error-codes.spec.ts.
 * - Every key a module throws must be listed here (see `errorCodesComplete`).
 * Ranges: 9000xx system, 1001xx todo.
 */
export const ErrorCodes = {
	0: 'UNDEFINED_ERROR',
	900000: 'PROTOTYPE_ERROR',
	900403: 'UNAUTHORIZED',
	900422: 'VALIDATE_ERROR',
	900423: 'BAD_REQUEST',
	// TODO
	100101: 'TODO_NOT_FOUND',
	100102: 'TODO_DELETE_ERROR',
	100103: 'TODO_CREATE_ERROR',
	100104: 'TODO_UPDATE_ERROR',
	100105: 'TODO_EXIST',
	100106: 'INVALID_TODO_TITLE',
	//
} as const satisfies Record<number, string>;

export type ErrorKey = (typeof ErrorCodes)[keyof typeof ErrorCodes];

// Add each module's key type here: `| UserErrorKey | ...`
type ThrownErrorKey = SystemErrorKey | TodoErrorKey;

// Compile error names the missing key, e.g. `Type 'true' is not assignable to type '"TODO_X"'`.
type MissingErrorKey = Exclude<ThrownErrorKey, ErrorKey>;
export const errorCodesComplete: [MissingErrorKey] extends [never] ? true : MissingErrorKey = true;
