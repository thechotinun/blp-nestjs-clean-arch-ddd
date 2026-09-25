import { Injectable } from '@nestjs/common';
import {
  type Mapper,
  toAuditColumns,
  toEntityAudit,
} from '../../../../shared/infrastructure/database/index.js';
import { Todo } from '../../domain/index.js';
import { TodoOrmEntity } from './todo.orm-entity.js';

@Injectable()
export class TodoMapper implements Mapper<Todo, TodoOrmEntity> {
  toDomain(record: TodoOrmEntity): Todo {
    return Todo.restore(
      { title: record.title, description: record.description },
      record.id,
      toEntityAudit(record),
    );
  }

  toPersistence(todo: Todo): TodoOrmEntity {
    return Object.assign(new TodoOrmEntity(), {
      id: todo.id,
      title: todo.title,
      description: todo.description,
      ...toAuditColumns(todo.audit),
    });
  }
}
