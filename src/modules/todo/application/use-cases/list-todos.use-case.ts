import { Inject, Injectable } from '@nestjs/common';
import type { Paginated, PaginationParams, UseCase } from '../../../../shared/application/index.js';
import { TODO_QUERY_SERVICE, type TodoQueryService } from '../todo.query.js';
import type { TodoView } from '../todo.view.js';

@Injectable()
export class ListTodosUseCase implements UseCase<PaginationParams, Paginated<TodoView>> {
	constructor(@Inject(TODO_QUERY_SERVICE) private readonly todoQuery: TodoQueryService) {}

	execute(params: PaginationParams): Promise<Paginated<TodoView>> {
		return this.todoQuery.findAll(params);
	}
}
