import type { Entity } from './entity.base.js';

/**
 * Write-side port: load and persist whole aggregates.
 * Reads for display (lists, pagination, audit fields) go through a `QueryService` in application.
 * Module ports extend this and add their own methods:
 *
 * @example
 * export interface TodoRepository extends Repository<Todo> {
 *   findByTitle(title: string): Promise<Todo | null>;
 * }
 */
export interface Repository<TEntity extends Entity<object>> {
	findById(id: string): Promise<TEntity | null>;
	save(entity: TEntity): Promise<void>;
	/** Soft delete. Load the aggregate first so its deletion rules run. */
	delete(entity: TEntity): Promise<void>;
}
