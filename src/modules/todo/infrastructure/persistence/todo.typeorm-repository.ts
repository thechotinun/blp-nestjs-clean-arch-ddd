import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmBaseRepository } from '../../../../shared/infrastructure/database/index.js';
import type { Todo, TodoRepository } from '../../domain/index.js';
import { TodoMapper } from './todo.mapper.js';
import { TodoOrmEntity } from './todo.orm-entity.js';

@Injectable()
export class TodoTypeOrmRepository
	extends TypeOrmBaseRepository<Todo, TodoOrmEntity>
	implements TodoRepository
{
	constructor(
		@InjectRepository(TodoOrmEntity) repository: Repository<TodoOrmEntity>,
		mapper: TodoMapper,
	) {
		super(repository, mapper);
	}
}
