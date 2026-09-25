import { Column, DataSource, Entity } from 'typeorm';
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
