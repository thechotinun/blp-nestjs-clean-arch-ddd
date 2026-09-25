import { Entity } from './entity.base.js';

class Sample extends Entity<{ name: string }> {
  static create(name: string) {
    return new Sample({ name });
  }

  static restore(name: string, id: string, isActive: boolean) {
    return new Sample({ name }, id, isActive);
  }

  disable() {
    this.deactivate();
  }

  enable() {
    this.activate();
  }
}

describe('Entity', () => {
  it('should create with a generated uuid and active state', () => {
    const entity = Sample.create('a');

    expect(entity.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(entity.isActive).toBe(true);
  });

  it('should restore id and isActive', () => {
    const entity = Sample.restore('a', 'id-1', false);

    expect(entity.id).toBe('id-1');
    expect(entity.isActive).toBe(false);
  });

  it('should toggle isActive through protected methods', () => {
    const entity = Sample.create('a');

    entity.disable();
    expect(entity.isActive).toBe(false);

    entity.enable();
    expect(entity.isActive).toBe(true);
  });

  it('should compare by id', () => {
    expect(
      Sample.restore('a', 'id-1', true).equals(
        Sample.restore('b', 'id-1', true),
      ),
    ).toBe(true);
    expect(Sample.create('a').equals(Sample.create('a'))).toBe(false);
  });
});
