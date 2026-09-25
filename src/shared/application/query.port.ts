import type { Paginated, PaginationParams } from './pagination.js';

/**
 * Read-side port: returns views (plain read models) straight from storage, no aggregates.
 * Module ports extend this and add their own queries (filters, search, ...).
 */
export interface QueryService<TView> {
  findById(id: string): Promise<TView | null>;
  findAll(params: PaginationParams): Promise<Paginated<TView>>;
}
