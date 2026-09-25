import type { FindOptionsWhere, Repository as OrmRepository } from 'typeorm';
import type { Entity, Repository } from '../../domain/index.js';
import type { BaseOrmEntity } from './base.orm-entity.js';
import type { Mapper } from './mapper.interface.js';

/**
 * Generic TypeORM implementation of the domain `Repository` port (write side).
 * Module repositories extend it and add their own methods using `this.repository` and `this.mapper`.
 */
export abstract class TypeOrmBaseRepository<
  TEntity extends Entity<object>,
  TOrmEntity extends BaseOrmEntity,
> implements Repository<TEntity> {
  protected constructor(
    protected readonly repository: OrmRepository<TOrmEntity>,
    protected readonly mapper: Mapper<TEntity, TOrmEntity>,
  ) {}

  async findById(id: string): Promise<TEntity | null> {
    const record = await this.repository.findOne({ where: this.byId(id) });
    return record ? this.mapper.toDomain(record) : null;
  }

  async save(entity: TEntity): Promise<void> {
    // Audit columns left undefined by the mapper are not touched on update.
    await this.repository.save(this.mapper.toPersistence(entity));
  }

  async delete(entity: TEntity): Promise<void> {
    await this.repository.softDelete(this.byId(entity.id));
  }

  protected byId(id: string): FindOptionsWhere<TOrmEntity> {
    return { id } as FindOptionsWhere<TOrmEntity>;
  }
}
