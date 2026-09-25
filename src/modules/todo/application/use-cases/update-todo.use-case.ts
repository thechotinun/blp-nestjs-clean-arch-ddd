import { Inject, Injectable } from '@nestjs/common';
import type { UseCase } from '../../../../shared/application/index.js';
import {
  type Todo,
  TODO_REPOSITORY,
  TodoNotFoundException,
  type TodoRepository,
} from '../../domain/index.js';

export interface UpdateTodoInput {
  id: string;
  title?: string;
  description?: string | null;
}

@Injectable()
export class UpdateTodoUseCase implements UseCase<UpdateTodoInput, Todo> {
  constructor(
    @Inject(TODO_REPOSITORY) private readonly todoRepository: TodoRepository,
  ) {}

  async execute({ id, ...changes }: UpdateTodoInput): Promise<Todo> {
    const todo = await this.todoRepository.findById(id);
    if (!todo) throw new TodoNotFoundException();

    todo.update(changes);
    return this.todoRepository.save(todo);
  }
}
