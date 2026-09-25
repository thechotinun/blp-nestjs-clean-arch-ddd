import { DomainErrorType, DomainException } from '../../../../shared/domain/index.js';
import { TodoErrorKey } from './todo-error-key.js';

export class InvalidTodoTitleException extends DomainException {
	constructor() {
		super(DomainErrorType.VALIDATION, TodoErrorKey.INVALID_TITLE);
	}
}
