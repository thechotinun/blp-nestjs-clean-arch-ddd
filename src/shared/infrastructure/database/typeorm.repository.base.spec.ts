import type { Repository as OrmRepository } from 'typeorm';
import type { Mocked } from 'vitest';
import {
  Sample,
  sampleMapper,
  SampleOrmEntity,
  sampleRecord,
} from './testing/sample.fixture.js';
import { TypeOrmBaseRepository } from './typeorm.repository.base.js';

class SampleRepository extends TypeOrmBaseRepository<Sample, SampleOrmEntity> {
  constructor(repository: OrmRepository<SampleOrmEntity>) {
    super(repository, sampleMapper);
  }
}

describe('TypeOrmBaseRepository', () => {
  let orm: Mocked<OrmRepository<SampleOrmEntity>>;
  let repository: SampleRepository;

  beforeEach(() => {
    orm = {
      findOne: vi.fn(),
      save: vi.fn(),
      softDelete: vi.fn(),
    } as unknown as Mocked<OrmRepository<SampleOrmEntity>>;
    repository = new SampleRepository(orm);
  });

  it('findById should map the record to an aggregate or return null', async () => {
    orm.findOne.mockResolvedValueOnce(
      sampleRecord('id-1', 'A', { isActive: false }),
    );
    orm.findOne.mockResolvedValueOnce(null);

    const found = await repository.findById('id-1');
    expect(found).toBeInstanceOf(Sample);
    expect(found).toMatchObject({ id: 'id-1', name: 'A', isActive: false });
    expect(orm.findOne).toHaveBeenCalledWith({ where: { id: 'id-1' } });

    await expect(repository.findById('missing')).resolves.toBeNull();
  });

  it('save should persist the mapped entity without audit columns', async () => {
    const sample = Sample.create('A');

    await repository.save(sample);

    const saved = orm.save.mock.calls[0][0] as SampleOrmEntity;
    expect(saved).toEqual(
      Object.assign(new SampleOrmEntity(), {
        id: sample.id,
        isActive: true,
        name: 'A',
      }),
    );
    expect(saved.createdBy).toBeUndefined();
  });

  it('delete should soft delete by aggregate id', async () => {
    const sample = Sample.restore('A', 'id-1', true);

    await repository.delete(sample);

    expect(orm.softDelete).toHaveBeenCalledWith({ id: 'id-1' });
  });
});
