import type { Entity } from './entity.base.js';
import type { Paginated, PaginationParams } from './pagination.js';

/**
 * Basic CRUD every aggregate repository gets.
 * Module ports extend this and add their own queries:
 *
 * @example
 * export interface TodoRepository extends Repository<Todo> {
 *   findByTitle(title: string): Promise<Todo | null>;
 * }
 */
export interface Repository<TEntity extends Entity<object>> {
  findById(id: string): Promise<TEntity | null>;
  findAll(params: PaginationParams): Promise<Paginated<TEntity>>;
  exists(id: string): Promise<boolean>;
  save(entity: TEntity): Promise<TEntity>;
  /** Soft delete. Returns false when nothing was deleted. */
  delete(id: string): Promise<boolean>;
}
