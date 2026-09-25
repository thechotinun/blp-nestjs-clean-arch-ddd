import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
	CreateTodoUseCase,
	DeleteTodoUseCase,
	GetTodoUseCase,
	ListTodosUseCase,
	TODO_QUERY_SERVICE,
	UpdateTodoUseCase,
} from './application/index.js';
import { TODO_REPOSITORY } from './domain/index.js';
import { TodoMapper } from './infrastructure/persistence/todo.mapper.js';
import { TodoOrmEntity } from './infrastructure/persistence/todo.orm-entity.js';
import { TodoTypeOrmQueryService } from './infrastructure/persistence/todo.typeorm-query.js';
import { TodoTypeOrmRepository } from './infrastructure/persistence/todo.typeorm-repository.js';
import { TodoController } from './presentation/todo.controller.js';

@Module({
	imports: [TypeOrmModule.forFeature([TodoOrmEntity])],
	controllers: [TodoController],
	providers: [
		TodoMapper,
		{ provide: TODO_REPOSITORY, useClass: TodoTypeOrmRepository },
		{ provide: TODO_QUERY_SERVICE, useClass: TodoTypeOrmQueryService },
		CreateTodoUseCase,
		GetTodoUseCase,
		ListTodosUseCase,
		UpdateTodoUseCase,
		DeleteTodoUseCase,
	],
})
export class TodoModule {}
