export enum DomainErrorType {
	VALIDATION = 'VALIDATION',
	UNAUTHORIZED = 'UNAUTHORIZED',
	FORBIDDEN = 'FORBIDDEN',
	NOT_FOUND = 'NOT_FOUND',
	CONFLICT = 'CONFLICT',
	BUSINESS_RULE = 'BUSINESS_RULE',
}

/**
 * Base for all business errors. Knows only its error key (e.g. `TODO_NOT_FOUND`):
 * the numeric code lives in the app-level catalog (`src/error-codes.ts`),
 * and presentation maps `type` to an HTTP status.
 *
 * @example
 * export class TodoNotFoundException extends DomainException {
 *   constructor() {
 *     super(DomainErrorType.NOT_FOUND, TodoErrorKey.NOT_FOUND);
 *   }
 * }
 */
export abstract class DomainException extends Error {
	protected constructor(
		readonly type: DomainErrorType,
		readonly key: string,
		readonly errors: unknown[] = [],
	) {
		super(key);
		this.name = new.target.name;
	}
}
