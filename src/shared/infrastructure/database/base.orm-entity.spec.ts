import { getMetadataArgsStorage } from 'typeorm';
import { toAuditColumns, toEntityAudit } from './audit.mapper.js';
import { BaseOrmEntity } from './base.orm-entity.js';

describe('BaseOrmEntity', () => {
  it('should declare audit columns with snake_case names', () => {
    const columns = getMetadataArgsStorage()
      .columns.filter((c) => c.target === BaseOrmEntity)
      .map((c) => [c.propertyName, c.mode, c.options.name]);

    expect(columns).toEqual([
      ['id', 'regular', undefined],
      ['isActive', 'regular', 'is_active'],
      ['createdDate', 'createDate', 'created_date'],
      ['createdBy', 'regular', 'created_by'],
      ['updatedDate', 'updateDate', 'updated_date'],
      ['updatedBy', 'regular', 'updated_by'],
      ['deletedDate', 'deleteDate', 'deleted_date'],
      ['deletedBy', 'regular', 'deleted_by'],
    ]);
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
