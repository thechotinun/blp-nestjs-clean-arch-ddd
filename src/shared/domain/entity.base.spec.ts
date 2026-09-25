import { type EntityAudit } from './entity-audit.js';
import { Entity } from './entity.base.js';

class Sample extends Entity<{ name: string }> {
  static create(name: string) {
    return new Sample({ name });
  }

  static restore(name: string, id: string, audit: EntityAudit) {
    return new Sample({ name }, id, audit);
  }

  disable() {
    this.deactivate();
  }
}

describe('Entity', () => {
  it('should create with a generated id and default audit', () => {
    const entity = Sample.create('a');

    expect(entity.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(entity.audit).toEqual({
      isActive: true,
      createdDate: null,
      createdBy: null,
      updatedDate: null,
      updatedBy: null,
      deletedDate: null,
      deletedBy: null,
    });
  });

  it('should restore id and audit', () => {
    const audit: EntityAudit = {
      isActive: false,
      createdDate: new Date('2026-09-24T10:51:52.557Z'),
      createdBy: 'user-1',
      updatedDate: new Date('2026-09-24T10:51:52.557Z'),
      updatedBy: 'user-1',
      deletedDate: null,
      deletedBy: null,
    };

    const entity = Sample.restore('a', 'id-1', audit);

    expect(entity.id).toBe('id-1');
    expect(entity.audit).toEqual(audit);
    expect(entity.isActive).toBe(false);
  });

  it('should toggle isActive without touching other audit fields', () => {
    const entity = Sample.create('a');

    entity.disable();

    expect(entity.isActive).toBe(false);
    expect(entity.audit.createdBy).toBeNull();
  });

  it('should compare by id', () => {
    const audit = Sample.create('x').audit;
    expect(
      Sample.restore('a', 'id-1', audit).equals(
        Sample.restore('b', 'id-1', audit),
      ),
    ).toBe(true);
    expect(Sample.create('a').equals(Sample.create('a'))).toBe(false);
  });
});
