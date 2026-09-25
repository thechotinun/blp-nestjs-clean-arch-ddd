# CLAUDE.md

NestJS 12 + TypeORM 1.x (PostgreSQL), Clean Architecture + DDD. Native ESM (`"type": "module"`, `nodenext`). Tests: vitest. Lint: oxlint. Format: prettier (2 spaces, single quotes).

## Commands

```bash
npm run start:dev          # dev server
npm run build              # nest build -> dist/
npm test                   # unit tests (*.spec.ts)
npm run test:e2e           # e2e (*.e2e-spec.ts) — needs a DB, reads .env.test
npm run lint
npx tsc --noEmit -p tsconfig.json   # type-check incl. specs (vitest does not type-check)

npm run migration:generate -- src/shared/infrastructure/database/migrations/<Name>
npm run migration:run
npm run migration:revert
```

Migration CLI runs against compiled `dist/` (no ts-node). Generated migrations go in `src/.../migrations/` and are compiled by `build`.

## Layout

```
src/
├── main.ts
├── app.module.ts                 # ConfigModule (global) + DatabaseModule + bounded-context modules
├── config/                       # configuration.ts — env -> typed config (single source)
├── shared/                       # shared kernel — no business rules
│   ├── domain/                   # Entity (+ EntityAudit), AggregateRoot, ValueObject, DomainEvent, exceptions/, Repository port, Paginated
│   ├── application/              # UseCase<I, O>
│   ├── infrastructure/database/  # DatabaseModule, TypeOrmConfigService, BaseOrmEntity, TypeOrmBaseRepository, audit mapper, Mapper, data-source (CLI), migrations/
│   └── presentation/http/        # ApiResponseInterceptor, HttpExceptionFilter, ValidationPipe, PaginationQueryDto, BaseResource
└── modules/<context>/            # one folder per bounded context — reference implementation: modules/todo
    ├── domain/
    │   ├── <name>.entity.ts              # aggregate / entity (extends AggregateRoot / Entity)
    │   ├── value-objects/<name>.vo.ts
    │   ├── events/<name>.event.ts
    │   ├── exceptions/<name>.exception.ts   # extends DomainException
    │   └── <name>.repository.ts          # port: `interface XRepository extends Repository<X>` + `X_REPOSITORY` symbol
    ├── application/
    │   ├── use-cases/<action>.use-case.ts   # implements UseCase
    │   └── dto/                              # use-case input/output (plain types)
    ├── infrastructure/
    │   ├── persistence/<name>.orm-entity.ts      # TypeORM @Entity, extends BaseOrmEntity
    │   ├── persistence/<name>.mapper.ts          # implements Mapper<Domain, OrmEntity>
    │   └── persistence/<name>.typeorm-repository.ts  # implements the domain port
    ├── presentation/
    │   ├── <name>.controller.ts
    │   ├── <name>.resource.ts                # `toXResource(entity)` = { ...toBaseResource(entity), ...fields }
    │   └── dto/                              # request DTOs (class-validator)
    └── <context>.module.ts
```

## Dependency rule

`presentation → application → domain ← infrastructure`

- `domain/` imports **nothing** from `@nestjs/*`, `typeorm`, or other layers. Pure TS only.
- `application/` depends on domain only (ports, entities). No TypeORM. `@Injectable`/`@Inject` allowed for DI.
- `infrastructure/` implements domain ports. Only place TypeORM is used.
- `presentation/` calls use cases; never touches repositories or ORM entities directly.
- Domain entity and ORM entity are separate classes, converted via a `*.mapper.ts`. Never return ORM entities past infrastructure.
- Bind ports in the context module: `{ provide: USER_REPOSITORY, useClass: UserTypeOrmRepository }`.

## Conventions

- **Imports:** relative paths with `.js` extension (`'./user.entity.js'`). No tsconfig `paths` aliases — tsc does not rewrite them in ESM output.
- **No `__dirname` / `require`** — use `import.meta.url` / `import.meta.dirname`.
- **Identity:** IDs are UUIDs generated in the domain (`Entity` base uses `randomUUID()`), so ORM PK is `@PrimaryColumn('uuid')` (from `BaseOrmEntity`), never `@PrimaryGeneratedColumn`.
- **Audit fields:** every ORM entity extends `BaseOrmEntity` → `id`, `isActive`, `createdDate/By`, `updatedDate/By`, `deletedDate/By` (columns `is_active`, `created_by`, …) (soft delete via `DeleteDateColumn`). Domain side: `Entity.audit` (`EntityAudit`), passed as 3rd arg on `restore(props, id, audit)`. In `*.mapper.ts` use `toEntityAudit(record)` / `...toAuditColumns(entity.audit)` — never map audit fields by hand. `*By` values are not set automatically yet.
- **Repositories:** domain port `Repository<T>` gives `findById`, `findAll(PaginationParams)`, `exists`, `save`, `delete` (soft). Implementation extends `TypeOrmBaseRepository<Domain, OrmEntity>` (constructor: `@InjectRepository(XOrmEntity)` repo + mapper). Module-specific queries: add to the module's port interface and implement in the module repository using `this.repository` / `this.mapper`. `save()` reloads the row so generated dates are returned.
- **Use cases:** one class per action, `@Injectable()`, inject the port with `@Inject(X_REPOSITORY)`. Throw module `DomainException`s (e.g. not found) here, not in controllers.
- **Validation:** global `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`, `transform`) → unknown body/query fields are rejected with 400. List endpoints take `@Query() PaginationQueryDto` → `query.toParams(configService.get('PER_PAGE'))` (`page` ≥ 1, `perPage` 1..100). Route ids use `ParseUUIDPipe`.
- **Empty values:** respond with `null`, not `""`.
- **Naming:** DB = snake_case, code = camelCase. Always set the column name explicitly in the decorator — no naming strategy: `@Column({ name: 'due_date', type: 'date', nullable: true }) dueDate`. Same for relations: `@JoinColumn({ name: 'assigned_user_id' })`. Table names explicit, plural snake_case: `@Entity('todos')`.
- **Migrations:** generate with `npm run migration:generate -- src/shared/infrastructure/database/migrations/<Name>` (needs DB) or hand-write matching the naming strategy.
- **Entities registration:** `autoLoadEntities: true` — register ORM entities with `TypeOrmModule.forFeature([...])` in each context module.
- **Relations (ESM):** type relation properties with `Relation<T>` from typeorm to avoid circular-import TDZ errors:
  `@ManyToOne(() => UserOrmEntity) user: Relation<UserOrmEntity>;`
- **Aggregates:** create via static factory (`static create(...)`), rehydrate via `static restore(props, id)`; constructor is `protected`/`private`. Mutate state only through methods that enforce invariants.
- **Value objects:** immutable, validated in factory, compared with `equals()`.
- **Domain events:** raised with `addDomainEvent()` inside the aggregate; collected with `pullDomainEvents()` after persistence. Dispatcher not yet wired.
- **Tests:** vitest globals (`vi.fn`, `describe`, `it`). Unit specs next to source (`*.spec.ts`). Domain tests need no Nest testing module.

## API response & errors

Routes are served under `/api/v1/...` (global prefix `api` + URI versioning, default `1`).
`ApiResponseInterceptor` and `HttpExceptionFilter` are registered globally in `AppModule` (`APP_INTERCEPTOR` / `APP_FILTER`).

- **Controllers return plain data** — never build the envelope by hand.
  - Single object → `{ data, status: { code, message } }`
  - `Paginated<T>` (from `shared/domain`) → `{ data, links, meta, status }`. Use `paginated.map(toResource)` to shape items.
  - `status.code` is the real HTTP status (`201` for POST, `@HttpCode` respected). 204 / `StreamableFile` pass through unwrapped.
- **Pagination links:** `first` = `?perPage=N`, `previous`/`next`/`last` = `?page=X&perPage=N`, `""` when absent. Other query params are kept.
- **Errors:** throw a `DomainException` subclass from domain/application — never a Nest `HttpException` there. Domain knows only the error **key**; the numeric code lives in the catalog.
  ```ts
  // modules/todo/domain/exceptions/todo-error-key.ts
  export const TodoErrorKey = { NOT_FOUND: 'TODO_NOT_FOUND' } as const;
  // modules/todo/domain/exceptions/todo-not-found.exception.ts
  export class TodoNotFoundException extends DomainException {
    constructor() {
      super(DomainErrorType.NOT_FOUND, TodoErrorKey.NOT_FOUND);
    }
  }
  ```
  Body: `{ status: { code, message }, error: { code: <catalog code>, message: <key>, errors } }`. `DomainErrorType` → HTTP: VALIDATION 400, UNAUTHORIZED 401, FORBIDDEN 403, NOT_FOUND 404, CONFLICT 409, BUSINESS_RULE 422.
- **Error catalog — `src/error-codes.ts`** (composition root; the only place codes are assigned): `{ code: 'KEY' }`. Ranges: `9000xx` system, `1001xx` todo, next module `1002xx`.
  - New module: add its codes to the catalog **and** its `XErrorKey` type to `ThrownErrorKey` there.
  - Guards: duplicate code → TS1117; key thrown but missing from catalog → compile error naming the key; duplicate key → `ErrorCodeRegistry` throws at startup + `error-codes.spec.ts`.
  - Shared layer receives the catalog via `ERROR_CODE_REGISTRY` (provided in `AppModule`) — shared never imports modules.
- **Non-domain errors:** ValidationPipe → `900422 VALIDATE_ERROR` (`errors` = messages); other 400 → `900423 BAD_REQUEST`; 401/403 → `900403 UNAUTHORIZED`; anything else (unknown route, 500) → `0 UNDEFINED_ERROR`. Unknown errors are logged; no internals in body.

## Not yet implemented

- Auth / current user → `createdBy` / `updatedBy` / `deletedBy` are always `null`.
- Domain event dispatcher, transactions / unit of work, Swagger.
