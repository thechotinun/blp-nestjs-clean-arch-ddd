import { Inject, Injectable } from '@nestjs/common';
import type { UseCase } from '../../../../shared/application/index.js';
import {
  TODO_REPOSITORY,
  TodoNotFoundException,
  type TodoRepository,
} from '../../domain/index.js';

@Injectable()
export class DeleteTodoUseCase implements UseCase<string, void> {
  constructor(
    @Inject(TODO_REPOSITORY) private readonly todoRepository: TodoRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const deleted = await this.todoRepository.delete(id);
    if (!deleted) throw new TodoNotFoundException();
  }
}
