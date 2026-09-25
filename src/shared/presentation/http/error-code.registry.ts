/** Error keys the shared HTTP layer itself emits; the app catalog must define all of them. */
export const SystemErrorKey = {
	UNDEFINED: 'UNDEFINED_ERROR',
	VALIDATE: 'VALIDATE_ERROR',
	BAD_REQUEST: 'BAD_REQUEST',
	UNAUTHORIZED: 'UNAUTHORIZED',
} as const;
export type SystemErrorKey = (typeof SystemErrorKey)[keyof typeof SystemErrorKey];

export const ERROR_CODE_REGISTRY = Symbol('ERROR_CODE_REGISTRY');

/** Looks up the numeric API code of an error key, from a `{ code: key }` catalog. */
export class ErrorCodeRegistry {
	private readonly codes = new Map<string, number>();

	constructor(catalog: Readonly<Record<number, string>>) {
		for (const [code, key] of Object.entries(catalog)) {
			const existing = this.codes.get(key);
			if (existing !== undefined) {
				throw new Error(`Error key "${key}" is used by both ${existing} and ${code}`);
			}
			this.codes.set(key, Number(code));
		}
	}

	codeOf(key: string): number | undefined {
		return this.codes.get(key);
	}
}
