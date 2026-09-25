import { DomainErrorType, DomainException } from '../../../../shared/domain/index.js';
import { TodoErrorKey } from './todo-error-key.js';

export class TodoNotFoundException extends DomainException {
	constructor() {
		super(DomainErrorType.NOT_FOUND, TodoErrorKey.NOT_FOUND);
	}
}
