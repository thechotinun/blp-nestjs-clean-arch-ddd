import type { TodoErrorKey } from './modules/todo/domain/index.js';
import type { SystemErrorKey } from './shared/presentation/index.js';

// Add each module's key type here: `| UserErrorKey | ...`
type ThrownErrorKey = SystemErrorKey | TodoErrorKey;

/**
 * Single catalog of API error codes: `{ KEY: code }`.
 * - Duplicate keys fail to compile (TS1117).
 * - Duplicate codes fail to compile (`noDuplicateCode`), at startup (ErrorCodeRegistry) and in error-codes.spec.ts.
 * - A key that is thrown but missing here fails to compile, naming the key.
 * - A key nobody throws (typo, leftover) fails to compile: "Did you mean ...?".
 * Ranges: 9000xx system, 1001xx todo.
 */
export const ErrorCodes = {
	UNDEFINED_ERROR: 0,
	PROTOTYPE_ERROR: 900000,
	UNAUTHORIZED: 900403,
	VALIDATE_ERROR: 900422,
	BAD_REQUEST: 900423,
	// TODO 1001xx
	TODO_NOT_FOUND: 100101,
	// 100102–100105 retired (TODO_DELETE/CREATE/UPDATE_ERROR, TODO_EXIST) — do not reuse
	INVALID_TODO_TITLE: 100106,
	//
} as const satisfies Record<ThrownErrorKey, number>;

export type ErrorKey = keyof typeof ErrorCodes;

// Keys whose code is also used by another key; `never` when every code is unique.
type DuplicateCode<T extends Record<string, number>> = {
	[K in keyof T]: T[K] extends T[Exclude<keyof T, K>] ? K : never;
}[keyof T];

// Compile error lists the clashing codes, e.g. `Type 'true' is not assignable to type 'DuplicateCode<{ ... A: 100101; B: 100101 ... }>'`.
export const noDuplicateCode: [DuplicateCode<typeof ErrorCodes>] extends [never]
	? true
	: DuplicateCode<typeof ErrorCodes> = true;
