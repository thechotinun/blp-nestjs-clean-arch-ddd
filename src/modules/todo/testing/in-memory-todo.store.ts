// Test-only in-memory adapters. Repository and query share one store,
// so a write is immediately visible to reads (like the real DB).
import { Paginated } from '../../../shared/application/index.js';
import type { TodoQueryService, TodoView } from '../application/index.js';
import type { Todo, TodoRepository } from '../domain/index.js';

export class InMemoryTodoStore {
	readonly rows = new Map<string, TodoView>();
	private readonly aggregates = new Map<string, Todo>();

	readonly repository: TodoRepository = {
		findById: async (id) =>
			this.rows.get(id)?.deletedDate ? null : (this.aggregates.get(id) ?? null),
		save: async (todo) => {
			const now = new Date();
			const existing = this.rows.get(todo.id);
			this.aggregates.set(todo.id, todo);
			this.rows.set(todo.id, {
				id: todo.id,
				isActive: todo.isActive,
				createdDate: existing?.createdDate ?? now,
				createdBy: existing?.createdBy ?? null,
				updatedDate: now,
				updatedBy: existing?.updatedBy ?? null,
				deletedDate: null,
				deletedBy: null,
				title: todo.title.value,
				description: todo.description,
			});
		},
		delete: async (todo) => {
			const row = this.rows.get(todo.id);
			if (row) row.deletedDate = new Date();
		},
	};

	readonly query: TodoQueryService = {
		findById: async (id) => {
			const row = this.rows.get(id);
			return row && !row.deletedDate ? row : null;
		},
		findAll: async ({ page, perPage }) => {
			const live = [...this.rows.values()].filter((r) => !r.deletedDate);
			const start = (page - 1) * perPage;
			return new Paginated(live.slice(start, start + perPage), live.length, page, perPage);
		},
	};
}
