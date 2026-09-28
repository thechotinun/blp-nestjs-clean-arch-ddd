/** Error keys the shared HTTP layer itself emits; the app catalog must define all of them. */
export const SystemErrorKey = {
	UNDEFINED: 'UNDEFINED_ERROR',
	PROTOTYPE: 'PROTOTYPE_ERROR',
	VALIDATE: 'VALIDATE_ERROR',
	BAD_REQUEST: 'BAD_REQUEST',
	UNAUTHORIZED: 'UNAUTHORIZED',
} as const;
export type SystemErrorKey = (typeof SystemErrorKey)[keyof typeof SystemErrorKey];

export const ERROR_CODE_REGISTRY = Symbol('ERROR_CODE_REGISTRY');

/** Looks up the numeric API code of an error key, from a `{ KEY: code }` catalog. */
export class ErrorCodeRegistry {
	private readonly codes = new Map<string, number>();

	constructor(catalog: Readonly<Record<string, number>>) {
		const keysByCode = new Map<number, string>();
		for (const [key, code] of Object.entries(catalog)) {
			const existing = keysByCode.get(code);
			if (existing !== undefined) {
				throw new Error(`Error code ${code} is used by both "${existing}" and "${key}"`);
			}
			keysByCode.set(code, key);
			this.codes.set(key, code);
		}
	}

	codeOf(key: string): number | undefined {
		return this.codes.get(key);
	}
}
