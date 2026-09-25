import { AggregateRoot } from '../../../shared/domain/index.js';
import { TodoTitle } from './value-objects/index.js';

export interface TodoProps {
	title: TodoTitle;
	description: string | null;
}

export class Todo extends AggregateRoot<TodoProps> {
	static create(input: { title: string; description?: string | null }): Todo {
		return new Todo({
			title: TodoTitle.create(input.title),
			description: input.description ?? null,
		});
	}

	static restore(props: TodoProps, id: string, isActive: boolean): Todo {
		return new Todo(props, id, isActive);
	}

	get title(): TodoTitle {
		return this.props.title;
	}

	get description(): string | null {
		return this.props.description;
	}

	/** `undefined` keeps the current value; `null` clears description. */
	update(input: { title?: string; description?: string | null }): void {
		if (input.title !== undefined) {
			this.props.title = TodoTitle.create(input.title);
		}
		if (input.description !== undefined) {
			this.props.description = input.description;
		}
	}

	/** Call before `repository.delete(todo)`. Deletion rules (e.g. "completed todos can't be deleted") go here. */
	delete(): void {}
}
