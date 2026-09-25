import { Inject, Injectable } from '@nestjs/common';
import type { UseCase } from '../../../../shared/application/index.js';
import {
  Todo,
  TODO_REPOSITORY,
  type TodoRepository,
} from '../../domain/index.js';

export interface CreateTodoInput {
  title: string;
  description?: string | null;
}

@Injectable()
export class CreateTodoUseCase implements UseCase<CreateTodoInput, Todo> {
  constructor(
    @Inject(TODO_REPOSITORY) private readonly todoRepository: TodoRepository,
  ) {}

  execute(input: CreateTodoInput): Promise<Todo> {
    return this.todoRepository.save(Todo.create(input));
  }
}
