import type { Repository as OrmRepository } from 'typeorm';
import type { Mocked } from 'vitest';
import { Todo } from '../../../modules/todo/domain/index.js';
import { TodoMapper } from '../../../modules/todo/infrastructure/persistence/todo.mapper.js';
import { TodoOrmEntity } from '../../../modules/todo/infrastructure/persistence/todo.orm-entity.js';
import { TypeOrmBaseRepository } from './typeorm.repository.base.js';

class TestRepository extends TypeOrmBaseRepository<Todo, TodoOrmEntity> {
  constructor(repository: OrmRepository<TodoOrmEntity>) {
    super(repository, new TodoMapper());
  }
}

const date = new Date('2026-09-24T10:51:52.557Z');
const record = (id: string, title: string) =>
  Object.assign(new TodoOrmEntity(), {
    id,
    title,
    description: null,
    isActive: true,
    createdDate: date,
    createdBy: null,
    updatedDate: date,
    updatedBy: null,
    deletedDate: null,
    deletedBy: null,
  });

describe('TypeOrmBaseRepository', () => {
  let orm: Mocked<OrmRepository<TodoOrmEntity>>;
  let repository: TestRepository;

  beforeEach(() => {
    orm = {
      findOne: vi.fn(),
      findOneOrFail: vi.fn(),
      findAndCount: vi.fn(),
      exists: vi.fn(),
      save: vi.fn(),
      softDelete: vi.fn(),
    } as unknown as Mocked<OrmRepository<TodoOrmEntity>>;
    repository = new TestRepository(orm);
  });

  it('findById should map the record or return null', async () => {
    orm.findOne.mockResolvedValueOnce(record('id-1', 'A'));
    orm.findOne.mockResolvedValueOnce(null);

    const found = await repository.findById('id-1');
    expect(found).toBeInstanceOf(Todo);
    expect(found?.title).toBe('A');
    expect(found?.audit.createdDate).toEqual(date);
    expect(orm.findOne).toHaveBeenCalledWith({ where: { id: 'id-1' } });

    await expect(repository.findById('missing')).resolves.toBeNull();
  });

  it('findAll should page with skip/take and newest first', async () => {
    orm.findAndCount.mockResolvedValue([[record('id-3', 'C')], 5]);

    const page = await repository.findAll({ page: 3, perPage: 2 });

    expect(orm.findAndCount).toHaveBeenCalledWith({
      order: { createdDate: 'DESC' },
      skip: 4,
      take: 2,
    });
    expect(page.items.map((t) => t.title)).toEqual(['C']);
    expect(page).toMatchObject({ totalItems: 5, page: 3, perPage: 2 });
  });

  it('save should persist mapped entity and return reloaded one', async () => {
    const todo = Todo.create({ title: 'A' });
    orm.findOneOrFail.mockResolvedValue(record(todo.id, 'A'));

    const saved = await repository.save(todo);

    expect(orm.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: todo.id, title: 'A', isActive: true }),
    );
    expect(saved.audit.createdDate).toEqual(date);
  });

  it('delete should soft delete and report whether a row was affected', async () => {
    orm.softDelete.mockResolvedValueOnce({ affected: 1 } as never);
    orm.softDelete.mockResolvedValueOnce({ affected: 0 } as never);

    await expect(repository.delete('id-1')).resolves.toBe(true);
    await expect(repository.delete('id-2')).resolves.toBe(false);
    expect(orm.softDelete).toHaveBeenCalledWith({ id: 'id-1' });
  });
});
