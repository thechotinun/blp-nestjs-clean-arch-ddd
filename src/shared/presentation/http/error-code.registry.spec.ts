import { ErrorCodeRegistry } from './error-code.registry.js';

describe('ErrorCodeRegistry', () => {
	it('should look up the code of a key', () => {
		const registry = new ErrorCodeRegistry({ 0: 'A', 100101: 'B' });

		expect(registry.codeOf('B')).toBe(100101);
		expect(registry.codeOf('A')).toBe(0);
		expect(registry.codeOf('C')).toBeUndefined();
	});

	it('should reject a key used by two codes', () => {
		expect(() => new ErrorCodeRegistry({ 100101: 'A', 100102: 'A' })).toThrow(
			'Error key "A" is used by both 100101 and 100102',
		);
	});
});
