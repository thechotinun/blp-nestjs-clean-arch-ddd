import { ErrorCodeRegistry } from './error-code.registry.js';

describe('ErrorCodeRegistry', () => {
	it('should look up the code of a key', () => {
		const registry = new ErrorCodeRegistry({ A: 0, B: 100101 });

		expect(registry.codeOf('B')).toBe(100101);
		expect(registry.codeOf('A')).toBe(0);
		expect(registry.codeOf('C')).toBeUndefined();
	});

	it('should reject a code used by two keys', () => {
		expect(() => new ErrorCodeRegistry({ A: 100101, B: 100101 })).toThrow(
			'Error code 100101 is used by both "A" and "B"',
		);
	});
});
