import { ErrorCodes } from './error-codes.js';
import { ErrorCodeRegistry, SystemErrorKey } from './shared/presentation/index.js';

describe('ErrorCodes', () => {
	it('should not reuse an error key for two codes', () => {
		expect(() => new ErrorCodeRegistry(ErrorCodes)).not.toThrow();
	});

	it('should define every system error key', () => {
		const registry = new ErrorCodeRegistry(ErrorCodes);

		for (const key of Object.values(SystemErrorKey)) {
			expect(registry.codeOf(key)).toEqual(expect.any(Number));
		}
	});
});
