import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './../src/app.module.js';

// Requires a reachable database (NODE_ENV=test reads .env.test).
describe('AppModule (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('should bootstrap', () => {
    expect(app).toBeDefined();
  });

  afterEach(async () => {
    await app?.close();
  });
});
