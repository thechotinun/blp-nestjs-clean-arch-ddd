import type { Repository } from '../../../shared/domain/index.js';
import type { Todo } from './todo.entity.js';

export const TODO_REPOSITORY = Symbol('TODO_REPOSITORY');

// Add todo-specific queries here; basic CRUD comes from Repository.
export interface TodoRepository extends Repository<Todo> {}
