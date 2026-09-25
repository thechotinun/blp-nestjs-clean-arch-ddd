import type { FindOptionsOrder, FindOptionsWhere, Repository as OrmRepository } from 'typeorm';
import {
	type BaseView,
	Paginated,
	type PaginationParams,
	type QueryService,
} from '../../application/index.js';
import type { BaseOrmEntity } from './base.orm-entity.js';

export const toBaseView = (record: BaseOrmEntity): BaseView => ({
	id: record.id,
	isActive: record.isActive,
	createdDate: record.createdDate ?? null,
	createdBy: record.createdBy ?? null,
	updatedDate: record.updatedDate ?? null,
	updatedBy: record.updatedBy ?? null,
	deletedDate: record.deletedDate ?? null,
	deletedBy: record.deletedBy ?? null,
});

/**
 * Generic TypeORM implementation of the application `QueryService` port (read side).
 * Module query services extend it, implement `toView`, and add their own queries.
 */
export abstract class TypeOrmBaseQueryService<
	TOrmEntity extends BaseOrmEntity,
	TView,
> implements QueryService<TView> {
	protected readonly defaultOrder = {
		createdDate: 'DESC',
	} as FindOptionsOrder<TOrmEntity>;

	protected constructor(protected readonly repository: OrmRepository<TOrmEntity>) {}

	protected abstract toView(record: TOrmEntity): TView;

	async findById(id: string): Promise<TView | null> {
		const record = await this.repository.findOne({
			where: { id } as FindOptionsWhere<TOrmEntity>,
		});
		return record ? this.toView(record) : null;
	}

	async findAll({ page, perPage }: PaginationParams): Promise<Paginated<TView>> {
		const [records, total] = await this.repository.findAndCount({
			order: this.defaultOrder,
			skip: (page - 1) * perPage,
			take: perPage,
		});
		return new Paginated(
			records.map((record) => this.toView(record)),
			total,
			page,
			perPage,
		);
	}
}
