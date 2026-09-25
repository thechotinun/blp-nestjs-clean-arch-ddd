import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import type { PaginationParams } from '../../application/index.js';

export const MAX_PER_PAGE = 100;

export class PaginationQueryDto {
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	page?: number;

	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	@Max(MAX_PER_PAGE)
	perPage?: number;

	toParams(defaultPerPage: number): PaginationParams {
		return { page: this.page ?? 1, perPage: this.perPage ?? defaultPerPage };
	}
}
