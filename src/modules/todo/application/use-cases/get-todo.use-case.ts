import { Inject, Injectable } from '@nestjs/common';
import type { UseCase } from '../../../../shared/application/index.js';
import {
  type Todo,
  TODO_REPOSITORY,
  TodoNotFoundException,
  type TodoRepository,
} from '../../domain/index.js';

@Injectable()
export class GetTodoUseCase implements UseCase<string, Todo> {
  constructor(
    @Inject(TODO_REPOSITORY) private readonly todoRepository: TodoRepository,
  ) {}

  async execute(id: string): Promise<Todo> {
    const todo = await this.todoRepository.findById(id);
    if (!todo) throw new TodoNotFoundException();
    return todo;
  }
}
