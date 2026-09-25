import { Inject, Injectable } from '@nestjs/common';
import type { UseCase } from '../../../../shared/application/index.js';
import type {
  Paginated,
  PaginationParams,
} from '../../../../shared/domain/index.js';
import {
  type Todo,
  TODO_REPOSITORY,
  type TodoRepository,
} from '../../domain/index.js';

@Injectable()
export class ListTodosUseCase implements UseCase<
  PaginationParams,
  Paginated<Todo>
> {
  constructor(
    @Inject(TODO_REPOSITORY) private readonly todoRepository: TodoRepository,
  ) {}

  execute(params: PaginationParams): Promise<Paginated<Todo>> {
    return this.todoRepository.findAll(params);
  }
}
