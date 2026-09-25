import type {
  FindOptionsOrder,
  FindOptionsWhere,
  Repository as OrmRepository,
} from 'typeorm';
import {
  type Entity,
  Paginated,
  type PaginationParams,
  type Repository,
} from '../../domain/index.js';
import type { BaseOrmEntity } from './base.orm-entity.js';
import type { Mapper } from './mapper.interface.js';

/**
 * Generic TypeORM implementation of the domain `Repository` port.
 * Module repositories extend it and add their own queries using `this.repository` and `this.mapper`.
 */
export abstract class TypeOrmBaseRepository<
  TEntity extends Entity<object>,
  TOrmEntity extends BaseOrmEntity,
> implements Repository<TEntity> {
  protected readonly defaultOrder = {
    createdDate: 'DESC',
  } as FindOptionsOrder<TOrmEntity>;

  protected constructor(
    protected readonly repository: OrmRepository<TOrmEntity>,
    protected readonly mapper: Mapper<TEntity, TOrmEntity>,
  ) {}

  async findById(id: string): Promise<TEntity | null> {
    const record = await this.repository.findOne({ where: this.byId(id) });
    return record ? this.mapper.toDomain(record) : null;
  }

  async findAll({
    page,
    perPage,
  }: PaginationParams): Promise<Paginated<TEntity>> {
    const [records, total] = await this.repository.findAndCount({
      order: this.defaultOrder,
      skip: (page - 1) * perPage,
      take: perPage,
    });
    return new Paginated(
      records.map((record) => this.mapper.toDomain(record)),
      total,
      page,
      perPage,
    );
  }

  exists(id: string): Promise<boolean> {
    return this.repository.exists({ where: this.byId(id) });
  }

  async save(entity: TEntity): Promise<TEntity> {
    await this.repository.save(this.mapper.toPersistence(entity));
    // Reload so generated columns (created/updated dates) come back from the database.
    const saved = await this.repository.findOneOrFail({
      where: this.byId(entity.id),
    });
    return this.mapper.toDomain(saved);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.softDelete(this.byId(id));
    return (result.affected ?? 0) > 0;
  }

  protected byId(id: string): FindOptionsWhere<TOrmEntity> {
    return { id } as FindOptionsWhere<TOrmEntity>;
  }
}
