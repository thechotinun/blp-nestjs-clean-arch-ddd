import {
  AggregateRoot,
  type EntityAudit,
} from '../../../shared/domain/index.js';
import { InvalidTodoTitleException } from './exceptions/index.js';

export const TODO_TITLE_MAX_LENGTH = 255;

export interface TodoProps {
  title: string;
  description: string | null;
}

export class Todo extends AggregateRoot<TodoProps> {
  static create(input: { title: string; description?: string | null }): Todo {
    return new Todo({
      title: Todo.validateTitle(input.title),
      description: input.description ?? null,
    });
  }

  static restore(props: TodoProps, id: string, audit: EntityAudit): Todo {
    return new Todo(props, id, audit);
  }

  get title(): string {
    return this.props.title;
  }

  get description(): string | null {
    return this.props.description;
  }

  /** `undefined` keeps the current value; `null` clears description. */
  update(input: { title?: string; description?: string | null }): void {
    if (input.title !== undefined) {
      this.props.title = Todo.validateTitle(input.title);
    }
    if (input.description !== undefined) {
      this.props.description = input.description;
    }
  }

  private static validateTitle(title: string): string {
    const value = title.trim();
    if (!value || value.length > TODO_TITLE_MAX_LENGTH) {
      throw new InvalidTodoTitleException();
    }
    return value;
  }
}
