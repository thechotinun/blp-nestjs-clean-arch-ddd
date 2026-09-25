import { ValueObject } from '../../../../shared/domain/index.js';
import { InvalidTodoTitleException } from '../exceptions/index.js';

export const TODO_TITLE_MAX_LENGTH = 255;

export class TodoTitle extends ValueObject<{ value: string }> {
	/** From user input: trimmed and validated. */
	static create(raw: string): TodoTitle {
		const value = raw.trim();
		if (!value || value.length > TODO_TITLE_MAX_LENGTH) {
			throw new InvalidTodoTitleException();
		}
		return new TodoTitle({ value });
	}

	/** From persistence: trusted as stored, so legacy rows never fail to load. */
	static restore(value: string): TodoTitle {
		return new TodoTitle({ value });
	}

	get value(): string {
		return this.props.value;
	}
}
