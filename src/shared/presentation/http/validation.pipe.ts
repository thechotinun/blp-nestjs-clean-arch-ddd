import { BadRequestException, ValidationPipe, type ValidationError } from '@nestjs/common';

/** Thrown for invalid request body/query/params so the filter can tell it apart from other 400s. */
export class RequestValidationException extends BadRequestException {
	constructor(readonly messages: string[]) {
		super(messages);
	}
}

// Strips/rejects unknown fields and converts payloads into DTO instances.
class AppValidationPipe extends ValidationPipe {
	constructor() {
		super({ whitelist: true, forbidNonWhitelisted: true, transform: true });
		this.exceptionFactory = (errors: ValidationError[]) =>
			new RequestValidationException(this.flattenValidationErrors(errors));
	}
}

export const createValidationPipe = () => new AppValidationPipe();
