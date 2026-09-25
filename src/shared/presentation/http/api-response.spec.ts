import {
  BadRequestException,
  Controller,
  Get,
  INestApplication,
  Post,
  Query,
  VersioningType,
} from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { Paginated } from '../../application/index.js';
import { DomainErrorType, DomainException } from '../../domain/index.js';
import { ApiResponseInterceptor } from './api-response.interceptor.js';
import { HttpExceptionFilter } from './http-exception.filter.js';

class ExampleNotFoundException extends DomainException {
  constructor() {
    super(DomainErrorType.NOT_FOUND, 100101, 'EXAMPLE_NOT_FOUND');
  }
}

const item = { id: '1c6d5a24-7453-4e46-8b7f-f56ef1d564e6', name: 'Sample' };

@Controller('examples')
class ExampleController {
  @Get()
  list(@Query('page') page = '1', @Query('total') total = '1') {
    return new Paginated([item], Number(total), Number(page), 10);
  }

  @Get('empty')
  empty() {
    return new Paginated([], 0, 1, 10);
  }

  @Get('one')
  one() {
    return item;
  }

  @Post()
  create() {
    return item;
  }

  @Get('missing')
  missing() {
    throw new ExampleNotFoundException();
  }

  @Get('invalid')
  invalid() {
    throw new BadRequestException(['name must be a string', 'age is required']);
  }

  @Get('boom')
  boom() {
    throw new Error('secret internals');
  }
}

describe('API response envelope', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ExampleController],
      providers: [
        { provide: APP_INTERCEPTOR, useClass: ApiResponseInterceptor },
        { provide: APP_FILTER, useClass: HttpExceptionFilter },
      ],
    }).compile();

    app = moduleRef.createNestApplication({ logger: false });
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should wrap a single resource', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/examples/one');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: item,
      status: { code: 200, message: 'OK' },
    });
  });

  it('should use the actual status code for POST', async () => {
    const res = await request(app.getHttpServer()).post('/api/v1/examples');

    expect(res.status).toBe(201);
    expect(res.body.status).toEqual({ code: 201, message: 'Created' });
  });

  it('should wrap a single page with empty previous/next', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/examples');

    expect(res.body).toEqual({
      data: [item],
      links: {
        first: '/api/v1/examples?perPage=10',
        previous: '',
        next: '',
        last: '/api/v1/examples?page=1&perPage=10',
      },
      meta: {
        totalItems: 1,
        itemCount: 1,
        itemsPerPage: 10,
        totalPages: 1,
        currentPage: 1,
      },
      status: { code: 200, message: 'OK' },
    });
  });

  it('should build previous/next links and keep other query params', async () => {
    const res = await request(app.getHttpServer()).get(
      '/api/v1/examples?page=2&perPage=10&total=30',
    );

    expect(res.body.links).toEqual({
      first: '/api/v1/examples?perPage=10&total=30',
      previous: '/api/v1/examples?page=1&perPage=10&total=30',
      next: '/api/v1/examples?page=3&perPage=10&total=30',
      last: '/api/v1/examples?page=3&perPage=10&total=30',
    });
    expect(res.body.meta).toMatchObject({ totalPages: 3, currentPage: 2 });
  });

  it('should return empty last link when there are no items', async () => {
    const res = await request(app.getHttpServer()).get(
      '/api/v1/examples/empty',
    );

    expect(res.body.links.last).toBe('');
    expect(res.body.meta).toEqual({
      totalItems: 0,
      itemCount: 0,
      itemsPerPage: 10,
      totalPages: 0,
      currentPage: 1,
    });
  });

  it('should map a domain exception to its status and business code', async () => {
    const res = await request(app.getHttpServer()).get(
      '/api/v1/examples/missing',
    );

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      status: { code: 404, message: 'Not Found' },
      error: { code: 100101, message: 'EXAMPLE_NOT_FOUND', errors: [] },
    });
  });

  it('should put validation messages into errors', async () => {
    const res = await request(app.getHttpServer()).get(
      '/api/v1/examples/invalid',
    );

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      status: { code: 400, message: 'Bad Request' },
      error: {
        code: 400,
        message: 'BAD_REQUEST',
        errors: ['name must be a string', 'age is required'],
      },
    });
  });

  it('should handle unknown routes', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/nope');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      status: { code: 404, message: 'Not Found' },
      error: { code: 404, message: 'NOT_FOUND', errors: [] },
    });
  });

  it('should hide internals of unexpected errors', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/examples/boom');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      status: { code: 500, message: 'Internal Server Error' },
      error: { code: 500, message: 'INTERNAL_SERVER_ERROR', errors: [] },
    });
  });
});
