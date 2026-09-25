import type { Mocked } from 'vitest';
import { Paginated } from '../../../../shared/domain/index.js';
import {
  Todo,
  TodoNotFoundException,
  type TodoRepository,
} from '../../domain/index.js';
import { CreateTodoUseCase } from './create-todo.use-case.js';
import { DeleteTodoUseCase } from './delete-todo.use-case.js';
import { GetTodoUseCase } from './get-todo.use-case.js';
import { ListTodosUseCase } from './list-todos.use-case.js';
import { UpdateTodoUseCase } from './update-todo.use-case.js';

const buildRepository = (): Mocked<TodoRepository> => ({
  findById: vi.fn(),
  findAll: vi.fn(),
  exists: vi.fn(),
  save: vi.fn(async (todo: Todo) => todo),
  delete: vi.fn(),
});

describe('Todo use cases', () => {
  let repository: Mocked<TodoRepository>;

  beforeEach(() => {
    repository = buildRepository();
  });

  it('CreateTodo should save a new todo', async () => {
    const todo = await new CreateTodoUseCase(repository).execute({
      title: 'A',
    });

    expect(repository.save).toHaveBeenCalledWith(todo);
    expect(todo.title).toBe('A');
  });

  it('GetTodo should return the todo', async () => {
    const todo = Todo.create({ title: 'A' });
    repository.findById.mockResolvedValue(todo);

    await expect(new GetTodoUseCase(repository).execute(todo.id)).resolves.toBe(
      todo,
    );
  });

  it('GetTodo should throw when not found', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(new GetTodoUseCase(repository).execute('x')).rejects.toThrow(
      TodoNotFoundException,
    );
  });

  it('ListTodos should pass pagination params to the repository', async () => {
    const page = new Paginated<Todo>([], 0, 2, 5);
    repository.findAll.mockResolvedValue(page);

    await expect(
      new ListTodosUseCase(repository).execute({ page: 2, perPage: 5 }),
    ).resolves.toBe(page);
    expect(repository.findAll).toHaveBeenCalledWith({ page: 2, perPage: 5 });
  });

  it('UpdateTodo should apply changes and save', async () => {
    const todo = Todo.create({ title: 'A', description: 'd' });
    repository.findById.mockResolvedValue(todo);

    const updated = await new UpdateTodoUseCase(repository).execute({
      id: todo.id,
      title: 'B',
    });

    expect(updated.title).toBe('B');
    expect(updated.description).toBe('d');
    expect(repository.save).toHaveBeenCalledWith(todo);
  });

  it('UpdateTodo should throw when not found', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(
      new UpdateTodoUseCase(repository).execute({ id: 'x', title: 'B' }),
    ).rejects.toThrow(TodoNotFoundException);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('DeleteTodo should throw when nothing was deleted', async () => {
    repository.delete.mockResolvedValue(false);

    await expect(
      new DeleteTodoUseCase(repository).execute('x'),
    ).rejects.toThrow(TodoNotFoundException);
  });
});
