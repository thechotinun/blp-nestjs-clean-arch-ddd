import {
	CallHandler,
	ExecutionContext,
	HttpStatus,
	Injectable,
	NestInterceptor,
	StreamableFile,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { STATUS_CODES } from 'node:http';
import { map, Observable } from 'rxjs';
import { Paginated } from '../../application/index.js';
import type {
	ApiResponse,
	PaginatedApiResponse,
	PaginationLinks,
	ResponseStatus,
} from './api-response.js';

/**
 * Wraps controller results into the API envelope.
 * Return a plain value for `{ data, status }`, or a `Paginated` for `{ data, links, meta, status }`.
 */
@Injectable()
export class ApiResponseInterceptor implements NestInterceptor {
	intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
		if (context.getType() !== 'http') return next.handle();

		const http = context.switchToHttp();
		const request = http.getRequest<Request>();
		const response = http.getResponse<Response>();

		return next.handle().pipe(
			map((result: unknown) => {
				if (result instanceof StreamableFile || response.statusCode === HttpStatus.NO_CONTENT) {
					return result;
				}

				const status = toResponseStatus(response.statusCode);

				if (result instanceof Paginated) {
					return toPaginatedResponse(result, request.originalUrl, status);
				}

				return {
					data: result ?? null,
					status,
				} satisfies ApiResponse<unknown>;
			}),
		);
	}
}

export function toResponseStatus(code: number): ResponseStatus {
	return { code, message: STATUS_CODES[code] ?? '' };
}

function toPaginatedResponse<T>(
	paginated: Paginated<T>,
	originalUrl: string,
	status: ResponseStatus,
): PaginatedApiResponse<T> {
	return {
		data: paginated.items,
		links: buildLinks(paginated, originalUrl),
		meta: {
			totalItems: paginated.totalItems,
			itemCount: paginated.items.length,
			itemsPerPage: paginated.perPage,
			totalPages: paginated.totalPages,
			currentPage: paginated.page,
		},
		status,
	};
}

function buildLinks(
	{ page, perPage, totalPages }: Paginated<unknown>,
	originalUrl: string,
): PaginationLinks {
	const [route, search = ''] = originalUrl.split('?');

	// Keep other query params (filters, sort) so links stay on the same result set.
	const extra = new URLSearchParams(search);
	extra.delete('page');
	extra.delete('perPage');
	const suffix = extra.size ? `&${extra.toString()}` : '';

	const link = (target?: number) =>
		target === undefined
			? `${route}?perPage=${perPage}${suffix}`
			: `${route}?page=${target}&perPage=${perPage}${suffix}`;

	return {
		first: link(),
		previous: page > 1 ? link(page - 1) : '',
		next: page < totalPages ? link(page + 1) : '',
		last: totalPages > 0 ? link(totalPages) : '',
	};
}
