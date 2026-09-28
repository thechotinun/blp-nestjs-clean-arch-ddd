import { Logger } from '@nestjs/common';
import { resolveErrorKey } from './error-codes.js';
import { SystemErrorKey } from './shared/presentation/index.js';

describe('resolveErrorKey', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('should define every system error key', () => {
		for (const key of Object.values(SystemErrorKey)) {
			expect(resolveErrorKey(key)).toEqual({ code: expect.any(Number), message: key });
		}
	});

	it('should resolve a module key to its code', () => {
		expect(resolveErrorKey('TODO_NOT_FOUND')).toEqual({ code: 100101, message: 'TODO_NOT_FOUND' });
	});

	it('should send an unregistered key as 900001 and warn', () => {
		const warn = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});

		expect(resolveErrorKey('NOPE')).toEqual({ code: 900001, message: 'UNREGISTERED_ERROR_KEY' });
		expect(warn).toHaveBeenCalledWith(expect.stringContaining("'NOPE'"));
	});
});
