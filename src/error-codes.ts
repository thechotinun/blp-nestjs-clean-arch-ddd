import { Logger } from '@nestjs/common';
import type { TodoErrorKey } from './modules/todo/domain/index.js';
import type { SystemErrorKey } from './shared/presentation/index.js';

// Add each module's key type here: `| UserErrorKey | ...`
type ThrownErrorKey = SystemErrorKey | TodoErrorKey;

/**
 * Single catalog of API error codes: `{ code: KEY }`.
 * - Duplicate codes fail to compile (TS1117).
 * - A key nobody throws (typo, leftover) fails to compile.
 * - A key that is thrown but missing here is sent as 900001 UNREGISTERED_ERROR_KEY and logged (see `resolveErrorKey`).
 * - A duplicate key is allowed; the last code wins.
 * Ranges: 9000xx system, 1001xx todo.
 */
export const ErrorCodes = {
	0: 'UNDEFINED_ERROR',
	900000: 'PROTOTYPE_ERROR',
	900001: 'UNREGISTERED_ERROR_KEY',
	900403: 'UNAUTHORIZED',
	900422: 'VALIDATE_ERROR',
	900423: 'BAD_REQUEST',
	// TODO 1001xx
	100101: 'TODO_NOT_FOUND',
	// 100102–100105 retired (TODO_DELETE/CREATE/UPDATE_ERROR, TODO_EXIST) — do not reuse
	100106: 'INVALID_TODO_TITLE',
	//
} as const satisfies Record<number, ThrownErrorKey>;

const logger = new Logger('ErrorCodes');

const codeByKey = new Map<string, number>(
	Object.entries(ErrorCodes).map(([code, key]) => [key, Number(code)]),
);

/**
 * Code and message to send for an error key. A key missing from `ErrorCodes` is sent
 * as 900001 UNREGISTERED_ERROR_KEY and logged, so it is easy to spot and add.
 */
export function resolveErrorKey(key: string): { code: number; message: string } {
	const code = codeByKey.get(key);

	if (code === undefined) {
		logger.warn(`Error key '${key}' has no code in src/error-codes.ts`);
		return { code: 900001, message: ErrorCodes[900001] };
	}

	return { code, message: key };
}
