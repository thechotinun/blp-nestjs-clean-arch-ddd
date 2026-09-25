import { INestApplication, VersioningType } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { ErrorCodes } from '../../../error-codes.js';
import { Paginated } from '../../../shared/domain/index.js';
import {
  ApiResponseInterceptor,
  createValidationPipe,
  ERROR_CODE_REGISTRY,
  ErrorCodeRegistry,
  HttpExceptionFilter,
} from '../../../shared/presentation/index.js';
import {
  CreateTodoUseCase,
  DeleteTodoUseCase,
  GetTodoUseCase,
  ListTodosUseCase,
  UpdateTodoUseCase,
} from '../application/use-cases/index.js';
import { Todo, TODO_REPOSITORY, type TodoRepository } from '../domain/index.js';
import { TodoController } from './todo.controller.js';

// In-memory port implementation: exercises controller + use cases + pipes without a DB.
class InMemoryTodoRepository implements TodoRepository {
  readonly items = new Map<string, Todo>();

  async findById(id: string) {
    return this.items.get(id) ?? null;
  }
  async findAll({ page, perPage }: { page: number; perPage: number }) {
    const all = [...this.items.values()];
    const start = (page - 1) * perPage;
    return new Paginated(
      all.slice(start, start + perPage),
      all.length,
      page,
      perPage,
    );
  }
  async exists(id: string) {
    return this.items.has(id);
  }
  async save(todo: Todo) {
    this.items.set(todo.id, todo);
    return todo;
  }
  async delete(id: string) {
    return this.items.delete(id);
  }
}

describe('TodoController (HTTP)', () => {
  let app: INestApplication;
  let repository: InMemoryTodoRepository;
  const url = '/api/v1/todos';

  beforeEach(async () => {
    repository = new InMemoryTodoRepository();
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          ignoreEnvFile: true,
          load: [() => ({ PER_PAGE: 10 })],
        }),
      ],
      controllers: [TodoController],
      providers: [
        { provide: TODO_REPOSITORY, useValue: repository },
        CreateTodoUseCase,
        GetTodoUseCase,
        ListTodosUseCase,
        UpdateTodoUseCase,
        DeleteTodoUseCase,
        { provide: APP_PIPE, useFactory: createValidationPipe },
        { provide: APP_INTERCEPTOR, useClass: ApiResponseInterceptor },
        { provide: APP_FILTER, useClass: HttpExceptionFilter },
        {
          provide: ERROR_CODE_REGISTRY,
          useValue: new ErrorCodeRegistry(ErrorCodes),
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication({ logger: false });
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('POST should create and return the resource', async () => {
    const res = await request(app.getHttpServer())
      .post(url)
      .send({ title: 'Buy milk', description: '2 bottles' });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      data: {
        id: expect.any(String),
        isActive: true,
        createdDate: null,
        createdBy: null,
        updatedDate: null,
        updatedBy: null,
        deletedDate: null,
        deletedBy: null,
        title: 'Buy milk',
        description: '2 bottles',
      },
      status: { code: 201, message: 'Created' },
    });
  });

  it('POST should reject invalid body and unknown fields', async () => {
    const res = await request(app.getHttpServer())
      .post(url)
      .send({ title: '', foo: 1 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatchObject({
      code: 900422,
      message: 'VALIDATE_ERROR',
    });
    expect(res.body.error.errors).toEqual(
      expect.arrayContaining([
        'property foo should not exist',
        'title should not be empty',
      ]),
    );
  });

  it('GET list should paginate with default perPage from config', async () => {
    await repository.save(Todo.create({ title: 'A' }));

    const res = await request(app.getHttpServer()).get(url);

    expect(res.body.meta).toEqual({
      totalItems: 1,
      itemCount: 1,
      itemsPerPage: 10,
      totalPages: 1,
      currentPage: 1,
    });
    expect(res.body.data[0].title).toBe('A');
  });

  it('GET list should reject invalid pagination query', async () => {
    const res = await request(app.getHttpServer()).get(`${url}?perPage=0`);

    expect(res.status).toBe(400);
  });

  it('GET one should return 404 with business code when missing', async () => {
    const res = await request(app.getHttpServer()).get(
      `${url}/1c6d5a24-7453-4e46-8b7f-f56ef1d564e6`,
    );

    expect(res.status).toBe(404);
    expect(res.body.error).toEqual({
      code: 100101,
      message: 'TODO_NOT_FOUND',
      errors: [],
    });
  });

  it('GET one should reject non-uuid id as BAD_REQUEST', async () => {
    const res = await request(app.getHttpServer()).get(`${url}/abc`);

    expect(res.status).toBe(400);
    expect(res.body.error).toEqual({
      code: 900423,
      message: 'BAD_REQUEST',
      errors: [],
    });
  });

  it('POST should map the domain title rule to its catalog code', async () => {
    const res = await request(app.getHttpServer())
      .post(url)
      .send({ title: '   ' });

    expect(res.status).toBe(400);
    expect(res.body.error).toEqual({
      code: 100106,
      message: 'INVALID_TODO_TITLE',
      errors: [],
    });
  });

  it('PATCH should update and allow clearing description', async () => {
    const todo = await repository.save(
      Todo.create({ title: 'A', description: 'd' }),
    );

    const res = await request(app.getHttpServer())
      .patch(`${url}/${todo.id}`)
      .send({ description: null });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ title: 'A', description: null });
  });

  it('DELETE should return 204 then 404', async () => {
    const todo = await repository.save(Todo.create({ title: 'A' }));

    await request(app.getHttpServer()).delete(`${url}/${todo.id}`).expect(204);
    await request(app.getHttpServer()).delete(`${url}/${todo.id}`).expect(404);
  });
});
