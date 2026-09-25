import {
  type BaseResource,
  toBaseResource,
} from '../../../shared/presentation/index.js';
import type { Todo } from '../domain/index.js';

export interface TodoResource extends BaseResource {
  title: string;
  description: string | null;
}

export const toTodoResource = (todo: Todo): TodoResource => ({
  ...toBaseResource(todo),
  title: todo.title,
  description: todo.description,
});
