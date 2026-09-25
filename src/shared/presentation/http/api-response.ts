export interface ResponseStatus {
	code: number;
	message: string;
}

export interface ApiResponse<T> {
	data: T;
	status: ResponseStatus;
}

export interface PaginationLinks {
	first: string;
	previous: string;
	next: string;
	last: string;
}

export interface PaginationMeta {
	totalItems: number;
	itemCount: number;
	itemsPerPage: number;
	totalPages: number;
	currentPage: number;
}

export interface PaginatedApiResponse<T> extends ApiResponse<T[]> {
	links: PaginationLinks;
	meta: PaginationMeta;
}

export interface ApiErrorResponse {
	status: ResponseStatus;
	error: {
		code: number;
		message: string;
		errors: unknown[];
	};
}
