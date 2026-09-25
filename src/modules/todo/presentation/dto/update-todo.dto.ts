import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { TODO_TITLE_MAX_LENGTH } from '../../domain/index.js';

export class UpdateTodoDto {
	@IsOptional()
	@IsString()
	@IsNotEmpty()
	@MaxLength(TODO_TITLE_MAX_LENGTH)
	title?: string;

	/** Send `null` to clear. */
	@IsOptional()
	@IsString()
	description?: string | null;
}
