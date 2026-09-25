import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import type { DataSourceOptions } from 'typeorm';
import type configuration from '../../../config/configuration.js';

export type DatabaseConfig = ReturnType<typeof configuration>['database'];

// Single mapping from app config to connection options, shared by Nest and the CLI data source.
export const buildConnectionOptions = (
	database: DatabaseConfig,
): Extract<DataSourceOptions, { type: 'postgres' }> => ({
	type: database.type as 'postgres',
	host: database.host,
	port: database.port,
	username: database.username,
	password: database.password,
	database: database.name,
	synchronize: database.sync,
});

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
	constructor(private configService: ConfigService) {}

	createTypeOrmOptions(): TypeOrmModuleOptions {
		return {
			...buildConnectionOptions(this.configService.getOrThrow<DatabaseConfig>('database')),
			// Entities are registered per bounded context via TypeOrmModule.forFeature().
			autoLoadEntities: true,
		};
	}
}
