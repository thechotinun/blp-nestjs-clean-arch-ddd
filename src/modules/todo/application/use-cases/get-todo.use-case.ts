import { Inject, Injectable } from '@nestjs/common';
import type { UseCase } from '../../../../shared/application/index.js';
import {
  getTodoViewOrThrow,
  TODO_QUERY_SERVICE,
  type TodoQueryService,
} from '../todo.query.js';
import type { TodoView } from '../todo.view.js';

@Injectable()
export class GetTodoUseCase implements UseCase<string, TodoView> {
  constructor(
    @Inject(TODO_QUERY_SERVICE) private readonly todoQuery: TodoQueryService,
  ) {}

  execute(id: string): Promise<TodoView> {
    return getTodoViewOrThrow(this.todoQuery, id);
  }
}
