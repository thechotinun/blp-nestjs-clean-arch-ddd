import { Todo, TodoNotFoundException } from '../../domain/index.js';
import { InMemoryTodoStore } from '../../testing/in-memory-todo.store.js';
import { CreateTodoUseCase } from './create-todo.use-case.js';
import { DeleteTodoUseCase } from './delete-todo.use-case.js';
import { GetTodoUseCase } from './get-todo.use-case.js';
import { ListTodosUseCase } from './list-todos.use-case.js';
import { UpdateTodoUseCase } from './update-todo.use-case.js';

describe('Todo use cases', () => {
	let store: InMemoryTodoStore;

	beforeEach(() => {
		store = new InMemoryTodoStore();
	});

	const seed = async (title = 'A', description: string | null = null) => {
		const todo = Todo.create({ title, description });
		await store.repository.save(todo);
		return todo;
	};

	it('CreateTodo should save the aggregate and return its view', async () => {
		const view = await new CreateTodoUseCase(store.repository, store.query).execute({
			title: ' A ',
		});

		expect(view).toMatchObject({
			title: 'A',
			description: null,
			isActive: true,
		});
		expect(store.rows.has(view.id)).toBe(true);
	});

	it('GetTodo should return the view or throw when missing', async () => {
		const todo = await seed();
		const useCase = new GetTodoUseCase(store.query);

		await expect(useCase.execute(todo.id)).resolves.toMatchObject({
			id: todo.id,
		});
		await expect(useCase.execute('missing')).rejects.toThrow(TodoNotFoundException);
	});

	it('ListTodos should page through the query service', async () => {
		await seed('A');
		await seed('B');

		const page = await new ListTodosUseCase(store.query).execute({
			page: 2,
			perPage: 1,
		});

		expect(page).toMatchObject({ totalItems: 2, page: 2, perPage: 1 });
		expect(page.items).toHaveLength(1);
	});

	it('UpdateTodo should change the aggregate, save, and return the view', async () => {
		const todo = await seed('A', 'd');

		const view = await new UpdateTodoUseCase(store.repository, store.query).execute({
			id: todo.id,
			title: 'B',
		});

		expect(view).toMatchObject({ title: 'B', description: 'd' });
	});

	it('UpdateTodo should throw when missing and not save', async () => {
		const save = vi.spyOn(store.repository, 'save');

		await expect(
			new UpdateTodoUseCase(store.repository, store.query).execute({
				id: 'missing',
				title: 'B',
			}),
		).rejects.toThrow(TodoNotFoundException);
		expect(save).not.toHaveBeenCalled();
	});

	it('DeleteTodo should load the aggregate, run its rule, then delete', async () => {
		const todo = await seed();
		const loaded = (await store.repository.findById(todo.id))!;
		const rule = vi.spyOn(loaded, 'delete');
		vi.spyOn(store.repository, 'findById').mockResolvedValueOnce(loaded);
		const remove = vi.spyOn(store.repository, 'delete');

		await new DeleteTodoUseCase(store.repository).execute(todo.id);

		expect(rule).toHaveBeenCalled();
		expect(remove).toHaveBeenCalledWith(loaded);
		await expect(store.query.findById(todo.id)).resolves.toBeNull();
	});

	it('DeleteTodo should throw when missing', async () => {
		await expect(new DeleteTodoUseCase(store.repository).execute('missing')).rejects.toThrow(
			TodoNotFoundException,
		);
	});
});
