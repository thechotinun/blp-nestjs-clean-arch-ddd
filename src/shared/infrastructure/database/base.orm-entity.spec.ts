import { Column, DataSource, Entity } from 'typeorm';
import { toAuditColumns, toEntityAudit } from './audit.mapper.js';
import { BaseOrmEntity } from './base.orm-entity.js';

describe('BaseOrmEntity', () => {
  it('should map camelCase properties to explicit snake_case columns', async () => {
    @Entity('samples')
    class SampleOrmEntity extends BaseOrmEntity {
      @Column({ name: 'display_name', type: 'varchar' })
      displayName: string;
    }

    const dataSource = new DataSource({
      type: 'postgres',
      entities: [SampleOrmEntity],
    });
    // Builds entity metadata without opening a connection.
    await (
      dataSource as unknown as { buildMetadatas(): Promise<void> }
    ).buildMetadatas();

    const columns = dataSource
      .getMetadata(SampleOrmEntity)
      .columns.map((c) => [c.propertyName, c.databaseName]);

    expect(columns).toEqual(
      expect.arrayContaining([
        ['id', 'id'],
        ['isActive', 'is_active'],
        ['createdDate', 'created_date'],
        ['createdBy', 'created_by'],
        ['updatedDate', 'updated_date'],
        ['updatedBy', 'updated_by'],
        ['deletedDate', 'deleted_date'],
        ['deletedBy', 'deleted_by'],
        ['displayName', 'display_name'],
      ]),
    );
    expect(columns).toHaveLength(9);
  });
});

describe('audit mapper', () => {
  const date = new Date('2026-09-24T10:51:52.557Z');

  it('should map ORM record to domain audit', () => {
    const record = Object.assign(new (class extends BaseOrmEntity {})(), {
      id: 'id-1',
      isActive: true,
      createdDate: date,
      createdBy: 'user-1',
      updatedDate: date,
      updatedBy: null,
      deletedDate: null,
      deletedBy: null,
    });

    expect(toEntityAudit(record)).toEqual({
      isActive: true,
      createdDate: date,
      createdBy: 'user-1',
      updatedDate: date,
      updatedBy: null,
      deletedDate: null,
      deletedBy: null,
    });
  });

  it('should write back only non-generated audit columns', () => {
    expect(
      toAuditColumns({
        isActive: false,
        createdDate: date,
        createdBy: 'user-1',
        updatedDate: date,
        updatedBy: 'user-2',
        deletedDate: date,
        deletedBy: 'user-3',
      }),
    ).toEqual({
      isActive: false,
      createdBy: 'user-1',
      updatedBy: 'user-2',
      deletedBy: 'user-3',
    });
  });
});
