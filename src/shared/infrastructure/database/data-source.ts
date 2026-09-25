// DataSource for the TypeORM CLI (migrations). Runs outside Nest against compiled output in dist/.
import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import configuration, { envFilePath } from '../../../config/configuration.js';
import { buildConnectionOptions } from './typeorm.config.js';

config({ path: envFilePath, quiet: true });

export default new DataSource({
	...buildConnectionOptions(configuration().database),
	// Schema changes go through migrations only.
	synchronize: false,
	// The CLI does not know about forFeature(), so entities are discovered by file name.
	entities: [new URL('../../../**/*.orm-entity.js', import.meta.url).pathname],
	migrations: [new URL('./migrations/*.js', import.meta.url).pathname],
});
