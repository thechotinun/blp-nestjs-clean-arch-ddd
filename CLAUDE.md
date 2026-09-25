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
├── app.module.ts                 # ConfigModule (global) + DatabaseModule + error catalog + bounded-context modules
├── error-codes.ts                # API error code catalog (composition root)
├── config/                       # configuration.ts — env -> typed config (single source)
├── shared/                       # shared kernel — no business rules, never imports modules/
│   ├── domain/                   # Entity (id + isActive), AggregateRoot, ValueObject, DomainEvent, DomainException, Repository port (write side)
│   ├── application/              # UseCase<I, O>, QueryService port (read side), Paginated/PaginationParams, BaseView
│   ├── infrastructure/database/  # DatabaseModule, TypeOrmConfigService, BaseOrmEntity, TypeOrmBaseRepository, TypeOrmBaseQueryService + toBaseView, Mapper, data-source (CLI), migrations/, testing/ (spec fixtures)
│   └── presentation/http/        # ApiResponseInterceptor, HttpExceptionFilter, ErrorCodeRegistry, ValidationPipe, PaginationQueryDto
└── modules/<context>/            # one folder per bounded context — reference implementation: modules/todo
    ├── domain/                   # write model: behaviour + invariants, no audit/pagination
    │   ├── <name>.entity.ts              # aggregate (extends AggregateRoot): create() / restore(props, id, isActive)
    │   ├── value-objects/<name>.vo.ts    # create(raw) validates; restore(stored) trusts DB
    │   ├── exceptions/                   # <name>-error-key.ts + <name>.exception.ts (extends DomainException)
    │   └── <name>.repository.ts          # write port: `interface XRepository extends Repository<X>` + `X_REPOSITORY`
    ├── application/
    │   ├── <name>.view.ts                # read model: `interface XView extends BaseView` — returned by use cases and the API
    │   ├── <name>.query.ts               # read port: `interface XQueryService extends QueryService<XView>` + `X_QUERY_SERVICE`
    │   └── use-cases/<action>.use-case.ts   # implements UseCase; returns XView / Paginated<XView> / void
    ├── infrastructure/persistence/
    │   ├── <name>.orm-entity.ts          # TypeORM @Entity, extends BaseOrmEntity
    │   ├── <name>.mapper.ts              # aggregate <-> ORM (write side only; no audit columns)
    │   ├── <name>.typeorm-repository.ts  # extends TypeOrmBaseRepository, implements XRepository
    │   └── <name>.typeorm-query.ts       # extends TypeOrmBaseQueryService, implements XQueryService (toView)
    ├── presentation/
    │   ├── <name>.controller.ts          # returns use-case results as-is
    │   └── dto/                          # request DTOs (class-validator)
    ├── testing/                          # in-memory adapters for specs (repository + query share one store)
    └── <context>.module.ts
```

## Dependency rule

`presentation → application → domain ← infrastructure`

- `domain/` imports **nothing** from `@nestjs/*`, `typeorm`, or other layers. Pure TS only. May import `shared/domain`.
- `application/` depends on domain + `shared/application`. No TypeORM. `@Injectable`/`@Inject` allowed for DI.
- `infrastructure/` implements domain (repository) and application (query) ports. Only place TypeORM is used.
- `presentation/` calls use cases only; never touches repositories, query services, aggregates or ORM entities.
- Each layer may import the same or inner layers of its own module and of `shared/`. `shared/` never imports `modules/`; modules never import each other.
- Enforced by `npm run lint`: `.oxlintrc.json` has `no-restricted-imports` overrides per layer (framework/ORM imports in domain, cross-layer imports, shared → modules, domain → `error-codes.ts`). Keep them in sync if you add a layer or folder.
- Bind ports in the context module: `{ provide: X_REPOSITORY, useClass: XTypeOrmRepository }`, `{ provide: X_QUERY_SERVICE, useClass: XTypeOrmQueryService }`.

## Write side vs read side

- **Write (commands):** use case loads the aggregate via `XRepository.findById`, calls its methods (invariants live there), then `save(aggregate)` / `delete(aggregate)`. Never delete by id without loading — the aggregate's `delete()` holds deletion rules.
- **Read (queries):** use case calls `XQueryService` which reads ORM rows straight into `XView` — no aggregate. Lists, pagination, filters, audit fields live here only.
- Commands that must return data (POST/PATCH) save, then read the view back via the query service (`getXViewOrThrow`).

## Conventions

- **Imports:** relative paths with `.js` extension (`'./user.entity.js'`). No tsconfig `paths` aliases — tsc does not rewrite them in ESM output.
- **No `__dirname` / `require`** — use `import.meta.url` / `import.meta.dirname`.
- **Identity:** IDs are UUIDs generated in the domain (`Entity` base uses `randomUUID()`), so ORM PK is `@PrimaryColumn({ name: 'id', type: 'uuid' })` (from `BaseOrmEntity`), never `@PrimaryGeneratedColumn`.
- **Audit fields:** every ORM entity extends `BaseOrmEntity` → `id`, `isActive`, `createdDate/By`, `updatedDate/By`, `deletedDate/By` (columns `is_active`, `created_by`, …; soft delete via `DeleteDateColumn`). Audit is **read-side only**: exposed through `toBaseView(record)` in `XView`. Domain entities carry only `id` + `isActive`. Mappers do not write audit columns — TypeORM leaves undefined columns untouched on update. `*By` values are not set automatically yet.
- **Repositories (write):** `Repository<T>` = `findById`, `save` (returns void), `delete(entity)` (soft). Implement via `TypeOrmBaseRepository<Aggregate, OrmEntity>` (`@InjectRepository(XOrmEntity)` repo + mapper). Module-specific write methods: add to `XRepository`, implement with `this.repository` / `this.mapper`.
- **Query services (read):** `QueryService<TView>` = `findById`, `findAll(PaginationParams)` → `Paginated<TView>` (newest first). Implement via `TypeOrmBaseQueryService<OrmEntity, XView>` + `toView(record)` = `{ ...toBaseView(record), ...fields }` with every value `?? null`.
- **Use cases:** one class per action, `@Injectable()`, inject ports with `@Inject(X_REPOSITORY)` / `@Inject(X_QUERY_SERVICE)`. Return `XView` (never aggregates). Throw module `DomainException`s (e.g. not found) here, not in controllers.
- **Validation:** global `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`, `transform`) → unknown body/query fields are rejected with 400. List endpoints take `@Query() PaginationQueryDto` → `query.toParams(configService.get('PER_PAGE'))` (`page` ≥ 1, `perPage` 1..100). Route ids use `ParseUUIDPipe`.
- **Empty values:** respond with `null`, not `""`.
- **Naming:** DB = snake_case, code = camelCase. Always set the column name explicitly in the decorator — no naming strategy: `@Column({ name: 'due_date', type: 'date', nullable: true }) dueDate`. Same for relations: `@JoinColumn({ name: 'assigned_user_id' })`. Table names explicit, plural snake_case: `@Entity('todos')`.
- **Migrations:** generate with `npm run migration:generate -- src/shared/infrastructure/database/migrations/<Name>` (needs DB) or hand-write matching the explicit column names in `BaseOrmEntity`.
- **Entities registration:** `autoLoadEntities: true` — register ORM entities with `TypeOrmModule.forFeature([...])` in each context module.
- **Relations (ESM):** type relation properties with `Relation<T>` from typeorm to avoid circular-import TDZ errors:
  `@ManyToOne(() => UserOrmEntity) user: Relation<UserOrmEntity>;`
- **Aggregates:** create via static factory (`static create(...)`), rehydrate via `static restore(props, id, isActive)`; constructor is `protected`/`private`. Mutate state only through methods that enforce invariants (incl. `delete()` before deletion).
- **Value objects:** immutable, `create(raw)` validates user input, `restore(stored)` skips validation for DB data, compared with `equals()`. Example: `TodoTitle`.
- **Domain events:** raised with `addDomainEvent()` inside the aggregate; collected with `pullDomainEvents()` after persistence. Dispatcher not yet wired.
- **Tests:** vitest globals (`vi.fn`, `describe`, `it`). Unit specs next to source (`*.spec.ts`). Domain tests need no Nest testing module. Module specs use `testing/in-memory-<name>.store.ts` (one store for both ports). Shared specs use `shared/infrastructure/database/testing/sample.fixture.ts` — never import a module. `testing/` folders are excluded from the build.

## API response & errors

Routes are served under `/api/v1/...` (global prefix `api` + URI versioning, default `1`).
`ApiResponseInterceptor` and `HttpExceptionFilter` are registered globally in `AppModule` (`APP_INTERCEPTOR` / `APP_FILTER`).

- **Controllers return plain data** — never build the envelope by hand.
  - Single object → `{ data, status: { code, message } }`
  - `Paginated<T>` (from `shared/application`) → `{ data, links, meta, status }`.
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
