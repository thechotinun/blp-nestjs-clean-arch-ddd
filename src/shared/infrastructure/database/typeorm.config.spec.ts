import type { ConfigService } from '@nestjs/config';
import {
  buildConnectionOptions,
  type DatabaseConfig,
  TypeOrmConfigService,
} from './typeorm.config.js';

const database: DatabaseConfig = {
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'user',
  password: 'pass',
  name: 'db',
  sync: false,
};

describe('buildConnectionOptions', () => {
  it('should map app database config to connection options', () => {
    expect(buildConnectionOptions(database)).toEqual({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'user',
      password: 'pass',
      database: 'db',
      synchronize: false,
    });
  });
});

describe('TypeOrmConfigService', () => {
  it('should build options from the database config with autoLoadEntities', () => {
    const configService = {
      getOrThrow: vi.fn((key: string) =>
        key === 'database' ? database : undefined,
      ),
    } as unknown as ConfigService;
    const service = new TypeOrmConfigService(configService);

    expect(service.createTypeOrmOptions()).toEqual({
      ...buildConnectionOptions(database),
      autoLoadEntities: true,
    });
  });
});
