import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Paginated } from '../../../shared/domain/index.js';
import { PaginationQueryDto } from '../../../shared/presentation/index.js';
import {
  CreateTodoUseCase,
  DeleteTodoUseCase,
  GetTodoUseCase,
  ListTodosUseCase,
  UpdateTodoUseCase,
} from '../application/use-cases/index.js';
import { CreateTodoDto } from './dto/create-todo.dto.js';
import { UpdateTodoDto } from './dto/update-todo.dto.js';
import { type TodoResource, toTodoResource } from './todo.resource.js';

@Controller('todos')
export class TodoController {
  constructor(
    private readonly configService: ConfigService,
    private readonly createTodo: CreateTodoUseCase,
    private readonly getTodo: GetTodoUseCase,
    private readonly listTodos: ListTodosUseCase,
    private readonly updateTodo: UpdateTodoUseCase,
    private readonly deleteTodo: DeleteTodoUseCase,
  ) {}

  @Post()
  async create(@Body() dto: CreateTodoDto): Promise<TodoResource> {
    return toTodoResource(await this.createTodo.execute(dto));
  }

  @Get()
  async findAll(
    @Query() query: PaginationQueryDto,
  ): Promise<Paginated<TodoResource>> {
    const params = query.toParams(this.configService.get<number>('PER_PAGE')!);
    return (await this.listTodos.execute(params)).map(toTodoResource);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<TodoResource> {
    return toTodoResource(await this.getTodo.execute(id));
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTodoDto,
  ): Promise<TodoResource> {
    return toTodoResource(await this.updateTodo.execute({ id, ...dto }));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.deleteTodo.execute(id);
  }
}
