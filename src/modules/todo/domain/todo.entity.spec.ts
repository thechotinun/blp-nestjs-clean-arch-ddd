import { InvalidTodoTitleException } from './exceptions/index.js';
import { Todo, TODO_TITLE_MAX_LENGTH } from './todo.entity.js';

describe('Todo', () => {
  it('should create with trimmed title and null description by default', () => {
    const todo = Todo.create({ title: '  Buy milk  ' });

    expect(todo.title).toBe('Buy milk');
    expect(todo.description).toBeNull();
    expect(todo.isActive).toBe(true);
  });

  it.each(['', '   ', 'x'.repeat(TODO_TITLE_MAX_LENGTH + 1)])(
    'should reject invalid title %#',
    (title) => {
      expect(() => Todo.create({ title })).toThrow(InvalidTodoTitleException);
    },
  );

  it('should update only provided fields and clear description with null', () => {
    const todo = Todo.create({ title: 'A', description: 'desc' });

    todo.update({ title: ' B ' });
    expect(todo.title).toBe('B');
    expect(todo.description).toBe('desc');

    todo.update({ description: null });
    expect(todo.title).toBe('B');
    expect(todo.description).toBeNull();
  });

  it('should reject invalid title on update', () => {
    const todo = Todo.create({ title: 'A' });

    expect(() => todo.update({ title: ' ' })).toThrow(
      InvalidTodoTitleException,
    );
    expect(todo.title).toBe('A');
  });
});
