export interface PaginationParams {
	page: number;
	perPage: number;
}

export class Paginated<T> {
	constructor(
		readonly items: T[],
		readonly totalItems: number,
		readonly page: number,
		readonly perPage: number,
	) {}

	get totalPages(): number {
		return Math.ceil(this.totalItems / this.perPage);
	}

	map<R>(fn: (item: T) => R): Paginated<R> {
		return new Paginated(this.items.map(fn), this.totalItems, this.page, this.perPage);
	}
}
