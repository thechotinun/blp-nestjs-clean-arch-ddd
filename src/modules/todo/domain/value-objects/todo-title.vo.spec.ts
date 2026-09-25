import { InvalidTodoTitleException } from '../exceptions/index.js';
import { TODO_TITLE_MAX_LENGTH, TodoTitle } from './todo-title.vo.js';

describe('TodoTitle', () => {
	it('should trim input', () => {
		expect(TodoTitle.create('  Buy milk ').value).toBe('Buy milk');
	});

	it.each(['', '   ', 'x'.repeat(TODO_TITLE_MAX_LENGTH + 1)])(
		'should reject invalid input %#',
		(raw) => {
			expect(() => TodoTitle.create(raw)).toThrow(InvalidTodoTitleException);
		},
	);

	it('should restore stored value without validation', () => {
		expect(TodoTitle.restore('  legacy ').value).toBe('  legacy ');
	});

	it('should compare by value', () => {
		expect(TodoTitle.create('A').equals(TodoTitle.create(' A '))).toBe(true);
		expect(TodoTitle.create('A').equals(TodoTitle.create('B'))).toBe(false);
	});
});
