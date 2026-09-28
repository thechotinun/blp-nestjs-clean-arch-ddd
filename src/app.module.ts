import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import configuration, { envFilePath } from './config/configuration.js';
import { resolveErrorKey } from './error-codes.js';
import { TodoModule } from './modules/todo/todo.module.js';
import { DatabaseModule } from './shared/infrastructure/database/index.js';
import {
	ApiResponseInterceptor,
	createValidationPipe,
	ERROR_KEY_RESOLVER,
	HttpExceptionFilter,
} from './shared/presentation/index.js';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			load: [configuration],
			envFilePath,
		}),
		DatabaseModule,
		TodoModule,
	],
	providers: [
		{
			provide: ERROR_KEY_RESOLVER,
			useValue: resolveErrorKey,
		},
		{ provide: APP_PIPE, useFactory: createValidationPipe },
		{ provide: APP_INTERCEPTOR, useClass: ApiResponseInterceptor },
		{ provide: APP_FILTER, useClass: HttpExceptionFilter },
	],
})
export class AppModule {}
