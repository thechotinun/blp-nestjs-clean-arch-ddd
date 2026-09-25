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
import type { Paginated } from '../../../shared/application/index.js';
import { PaginationQueryDto } from '../../../shared/presentation/index.js';
import {
  CreateTodoUseCase,
  DeleteTodoUseCase,
  GetTodoUseCase,
  ListTodosUseCase,
  type TodoView,
  UpdateTodoUseCase,
} from '../application/index.js';
import { CreateTodoDto } from './dto/create-todo.dto.js';
import { UpdateTodoDto } from './dto/update-todo.dto.js';

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
  create(@Body() dto: CreateTodoDto): Promise<TodoView> {
    return this.createTodo.execute(dto);
  }

  @Get()
  findAll(@Query() query: PaginationQueryDto): Promise<Paginated<TodoView>> {
    return this.listTodos.execute(
      query.toParams(this.configService.get<number>('PER_PAGE')!),
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<TodoView> {
    return this.getTodo.execute(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTodoDto,
  ): Promise<TodoView> {
    return this.updateTodo.execute({ id, ...dto });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.deleteTodo.execute(id);
  }
}
