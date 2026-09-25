import configuration from './configuration.js';

describe('configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should default port, database port and PER_PAGE when env vars are missing', () => {
    delete process.env.PORT;
    delete process.env.PER_PAGE;
    delete process.env.DATABASE_PORT;
    delete process.env.APP_URL;

    const config = configuration();

    expect(config.port).toBe(3000);
    expect(config.PER_PAGE).toBe(30);
    expect(config.database.port).toBe(5432);
    expect(config.APP_URL).toBe('http://localhost:3000');
  });

  it('should parse provided env vars', () => {
    process.env.PORT = '4000';
    process.env.PER_PAGE = '25';
    process.env.APP_URL = 'https://example.com';
    process.env.DATABASE_PORT = '5433';

    const config = configuration();

    expect(config.port).toBe(4000);
    expect(config.PER_PAGE).toBe(25);
    expect(config.APP_URL).toBe('https://example.com');
    expect(config.database.port).toBe(5433);
  });

  it('should use DATABASE_NAME_TEST when NODE_ENV is test', () => {
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_NAME_TEST = 'test_db';
    process.env.DATABASE_NAME = 'prod_db';

    const config = configuration();

    expect(config.database.name).toBe('test_db');
  });

  it('should use DATABASE_NAME when NODE_ENV is not test', () => {
    process.env.NODE_ENV = 'production';
    process.env.DATABASE_NAME = 'prod_db';
    process.env.DATABASE_NAME_TEST = 'test_db';

    const config = configuration();

    expect(config.database.name).toBe('prod_db');
  });

  it('should read name and version from package.json', () => {
    const config = configuration();

    expect(config.name).toBe('blp-nestjs-clean-arch-ddd');
    expect(config.version).toEqual(expect.any(String));
  });
});
