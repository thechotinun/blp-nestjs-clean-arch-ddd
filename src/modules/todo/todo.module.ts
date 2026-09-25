import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  CreateTodoUseCase,
  DeleteTodoUseCase,
  GetTodoUseCase,
  ListTodosUseCase,
  UpdateTodoUseCase,
} from './application/use-cases/index.js';
import { TODO_REPOSITORY } from './domain/index.js';
import { TodoMapper } from './infrastructure/persistence/todo.mapper.js';
import { TodoOrmEntity } from './infrastructure/persistence/todo.orm-entity.js';
import { TodoTypeOrmRepository } from './infrastructure/persistence/todo.typeorm-repository.js';
import { TodoController } from './presentation/todo.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([TodoOrmEntity])],
  controllers: [TodoController],
  providers: [
    TodoMapper,
    { provide: TODO_REPOSITORY, useClass: TodoTypeOrmRepository },
    CreateTodoUseCase,
    GetTodoUseCase,
    ListTodosUseCase,
    UpdateTodoUseCase,
    DeleteTodoUseCase,
  ],
})
export class TodoModule {}
