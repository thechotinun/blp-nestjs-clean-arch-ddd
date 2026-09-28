/** Error keys the shared HTTP layer itself emits; the app catalog must define all of them. */
export const SystemErrorKey = {
	UNDEFINED: 'UNDEFINED_ERROR',
	PROTOTYPE: 'PROTOTYPE_ERROR',
	UNREGISTERED: 'UNREGISTERED_ERROR_KEY',
	VALIDATE: 'VALIDATE_ERROR',
	BAD_REQUEST: 'BAD_REQUEST',
	UNAUTHORIZED: 'UNAUTHORIZED',
} as const;
export type SystemErrorKey = (typeof SystemErrorKey)[keyof typeof SystemErrorKey];

/** Code and message to send for an error key. Implemented by the app error catalog. */
export type ErrorKeyResolver = (key: string) => { code: number; message: string };

export const ERROR_KEY_RESOLVER = Symbol('ERROR_KEY_RESOLVER');
